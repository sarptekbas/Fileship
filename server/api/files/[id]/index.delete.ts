import { rm } from 'node:fs/promises';

import { join } from 'pathe';

export default defineEventHandler(async (event) => {
    userOnly(event);

    const currentUser = event.context.user!;
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

    await rm(join(dataDirectory, 'uploads', findFileById.fileName), {
        force: true,
    });

    await prisma.view.deleteMany({
        where: {
            fileId,
        },
    });

    await prisma.file.delete({
        where: {
            id: fileId,
        },
    });

    await createLog(event, {
        action: 'Delete File',
        message: `Deleted file ${findFileById.fileName}`,
    });

    sendToUser(currentUser.id, 'delete:file', fileId);
});
