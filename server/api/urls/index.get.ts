export default defineEventHandler(async (event) => {
    const currentUser = event.context.user;

    if (!currentUser) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'You do not have permission to perform this action',
        });
    }

    const urls = await prisma.url.findMany({
        where: {
            authorId: currentUser.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            views: true,
        },
    });

    const reqUrl = getRequestURL(event);

    const protocol = process.env.RETURN_HTTPS
        ? process.env.RETURN_HTTPS === 'true'
            ? 'https'
            : 'http'
        : reqUrl.protocol.slice(0, -1);

    const domain = currentUser.domains.length
        ? currentUser.domains[
              Math.floor(Math.random() * currentUser.domains.length)
          ]
        : reqUrl.host;

    return urls.map((url) => ({
        ...url,
        views: {
            total: url.views.length,
            today: url.views.filter((view) => {
                const now = new Date();

                return (
                    view.createdAt.getDate() === now.getDate() &&
                    view.createdAt.getMonth() === now.getMonth() &&
                    view.createdAt.getFullYear() === now.getFullYear()
                );
            }).length,
        },
        url: `${protocol}://${domain}/link/${url.vanity}`,
    }));
});
