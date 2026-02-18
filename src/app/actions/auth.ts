'use server';

import { cookies } from 'next/headers';

export async function loginAction(password: string) {
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
        console.error('[Auth] ADMIN_PASSWORD no está configurado en las variables de entorno.');
        return { success: false, error: 'Error de configuración del servidor' };
    }
    if (password.trim() === adminPass.trim()) {
        (await cookies()).set('admin_session', 'active', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 1 day
        });
        return { success: true };
    }
    return { success: false, error: 'Contraseña incorrecta' };
}

export async function logoutAction() {
    (await cookies()).delete('admin_session');
    return { success: true };
}

export async function checkAuthAction() {
    const session = (await cookies()).get('admin_session');
    return session?.value === 'active';
}
