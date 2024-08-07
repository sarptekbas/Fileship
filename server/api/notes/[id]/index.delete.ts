import { sendToUser } from '~~/server/plugins/socketIO';

export default defineEventHandler(async (event) => {
    const currentUser = event.context.user;
    if (!currentUser) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'You do not have permission to perform this action',
        });
    }

    const noteId = getRouterParam(event, 'id');

    const findNoteById = await prisma.note.findUnique({
        where: {
            id: noteId,
        },
    });

    if (!findNoteById) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: 'Note not found',
        });
    }

    if (findNoteById.authorId !== currentUser.id) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            message: 'You do not have permission to perform this action',
        });
    }

    await prisma.note.delete({
        where: {
            id: noteId,
        },
    });

    await createLog(event, {
        action: 'Delete Note',
        message: `Deleted ${findNoteById.title}`,
    });

    sendToUser(currentUser.id, 'delete:note', noteId);
});
