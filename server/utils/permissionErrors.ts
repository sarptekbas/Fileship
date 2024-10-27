import type { H3Event } from 'h3';

import {
    canShareCodes,
    canShortenUrls,
    canTakeNotes,
    canUploadFiles,
    isAdmin,
} from '~~/utils/permissions';

const unauthorizedError = createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message: 'You must be logged in to perform this action',
});

const forbiddenError = createError({
    statusCode: 403,
    statusMessage: 'Forbidden',
    message: 'You do not have permission to perform this action',
});

export const userOnly = (event: H3Event) => {
    if (!event.context.user) throw unauthorizedError;
};

export const adminOnly = (event: H3Event) => {
    userOnly(event);
    if (!isAdmin(event.context.user)) throw forbiddenError;
};

export const superAdminOnly = (event: H3Event) => {
    userOnly(event);
    if (!event.context.user!.superAdmin) throw forbiddenError;
};

export const codeSharerOnly = (event: H3Event) => {
    userOnly(event);
    if (!canShareCodes(event.context.user)) throw forbiddenError;
};

export const fileUploaderOnly = (event: H3Event) => {
    userOnly(event);
    if (!canUploadFiles(event.context.user)) throw forbiddenError;
};

export const noteTakerOnly = (event: H3Event) => {
    userOnly(event);
    if (!canTakeNotes(event.context.user)) throw forbiddenError;
};

export const urlShortenerOnly = (event: H3Event) => {
    userOnly(event);
    if (!canShortenUrls(event.context.user)) throw forbiddenError;
};
