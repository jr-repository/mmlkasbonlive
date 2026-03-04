const API_BASE_URL = "https://multimitralogistik.id/Backend/Api";

export const authService = {
    async login(email: string, password: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/Login/Auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const json = await response.json();

            if (json.s) {
                // Tambahkan pengembalian `token` dari json.token
                return { success: true, user: json.d, token: json.token };
            } else {
                return { success: false, message: json.message || "Login gagal" };
            }
        } catch (error) {
            return { success: false, message: "Terjadi kesalahan koneksi server" };
        }
    }
};