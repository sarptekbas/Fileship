import { rename } from 'node:fs/promises';

import { filesize } from 'filesize';
import { join } from 'pathe';
import { z } from 'zod';

const validationSchema = z
    .object(
        {
            fileName: z
                .string({
                    invalid_type_error: 'Invalid file name',
                })
                .max(255, 'File name must be at most 255 characters')
                .transform((value) => value.replace(/[^a-zA-Z0-9-_.]/g, ''))
                .optional(),
            password: z
                .string({
                    invalid_type_error: 'Invalid password',
                })
                .max(48, 'Password must be at most 48 characters')
                .nullish(),
            maxViews: z
                .number({
                    invalid_type_error: 'Invalid max views',
                })
                .min(0, 'Max views must be at least 0')
                .optional(),
            expiration: z
                .number({
                    invalid_type_error: 'Invalid expiration',
                })
                .min(0, 'Expiration must be at least 0')
                .nullish(),
            folderId: z
                .string({
                    invalid_type_error: 'Invalid folder id',
                })
                .nullish(),
        },
        { invalid_type_error: 'Invalid body', required_error: 'Missing body' },
    )
    .strict({
        message: 'Body contains unexpected keys',
    });

export default defineEventHandler(async (event) => {
    userOnly(event);

    const currentUser = event.context.user!;
    const body = await readValidatedBody(event, validationSchema.safeParse);

    if (!body.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Invalid body',
            data: { formErrors: body.error.format() },
        });
    }

    const fileId = getRouterParam(event, 'id');

    const findFileById = await prisma.file.findUnique({
        where: {
            id: fileId,
        },
    });

    if (!findFileById) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: 'File not found',
        });
    }

    if (findFileById.authorId !== currentUser.id) throw forbiddenError;

    if ('expiration' in body.data) {
        if (body.data.expiration) {
            (body.data as any).expiresAt = new Date(
                Date.now() + body.data.expiration,
            );
        } else (body.data as any).expiresAt = null;

        delete body.data.expiration;
    }

    if (body.data.folderId) {
        const findFolderById = await prisma.folder.findUnique({
            where: {
                id: body.data.folderId,
            },
        });

        if (!findFolderById) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: 'Folder not found',
            });
        }
    }

    if (body.data.fileName && body.data.fileName !== findFileById.fileName) {
        const findFileByFileName = await prisma.file.findUnique({
            where: {
                fileName: body.data.fileName,
            },
        });

        if (findFileByFileName) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Conflict',
                message: 'A file with that name already exists',
            });
        }

        await rename(
            join(dataDirectory, 'uploads', findFileById.fileName),
            join(dataDirectory, 'uploads', body.data.fileName),
        );
    }

    const _updatedFile = await prisma.file.update({
        where: {
            id: fileId,
        },
        include: {
            views: true,
        },
        data: body.data,
    });

    const updatedFile = {
        ..._updatedFile,
        size: {
            raw: _updatedFile.size.toString(),
            formatted: filesize(_updatedFile.size.toString()),
        },
        views: {
            total: _updatedFile.views.length,
            today: _updatedFile.views.filter((view) => {
                const now = new Date();

                return (
                    view.createdAt.getDate() === now.getDate() &&
                    view.createdAt.getMonth() === now.getMonth() &&
                    view.createdAt.getFullYear() === now.getFullYear()
                );
            }).length,
        },
        directUrl: buildPublicUrl(
            event,
            currentUser.domains,
            `/u/${_updatedFile.fileName}`,
        ),
        embedUrl: buildPublicUrl(
            event,
            currentUser.domains,
            `/view/${_updatedFile.fileName}`,
        ),
    };

    await createLog(event, {
        action: 'Update File',
        message: `Updated file ${updatedFile.fileName}`,
    });

    sendToUser(currentUser.id, 'update:file', updatedFile);

    if (body.data.folderId === null && findFileById.folderId !== null) {
        sendToUser(currentUser.id, 'folder:file:remove', {
            folderId: findFileById.folderId,
            fileId: updatedFile.id,
        });
    } else if (body.data.folderId !== null && findFileById.folderId === null) {
        sendToUser(currentUser.id, 'folder:file:add', {
            folderId: body.data.folderId,
            fileId: updatedFile.id,
        });
    }

    return updatedFile;
});
