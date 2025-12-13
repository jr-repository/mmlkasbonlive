// Lokasi: src/services/auth.service.ts

const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

export const authService = {
    async login(username: string, password: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/Login/Auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const json = await response.json();

            if (json.s) {
                return { success: true, user: json.d };
            } else {
                return { success: false, message: json.message || "Login gagal" };
            }
        } catch (error) {
            return { success: false, message: "Terjadi kesalahan koneksi server" };
        }
    }
};