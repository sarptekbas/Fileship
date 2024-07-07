import { hash } from 'argon2';

import { UserPermission } from '@prisma/client';

export default defineNitroPlugin(async () => {
    const findUser = await prisma.user.findFirst();

    if (!findUser) {
        await prisma.user.create({
            data: {
                username: 'root',
                password: await hash('password'),
                superAdmin: true,
                permissions: [UserPermission.Admin],
            },
        });
    }
});
