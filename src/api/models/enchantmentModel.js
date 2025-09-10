const db = require('../../config/database');

class EnchantmentModel {
    static async create(messageData) {
        const {
            wristband_code,
            user_name,
            message_text,
            sentiment,
            status,
            character_model,
            video_id
        } = messageData;

        const today = new Date().toISOString().slice(0, 10);

        if (wristband_code === '0108') {
            const sql = `
                INSERT INTO enchantment_messages (wristband_code, user_name, message_text, sentiment, status, character_model, video_id, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                user_name = VALUES(user_name), 
                message_text = VALUES(message_text), 
                sentiment = VALUES(sentiment), 
                status = VALUES(status), 
                character_model = VALUES(character_model), 
                video_id = VALUES(video_id)
            `;
            const [result] = await db.execute(sql, [wristband_code, user_name, message_text, sentiment, status, character_model, video_id, today]);
            return { id: result.insertId || (await this.findByWristbandAndDate(wristband_code)).id, ...messageData };
        } else {
            const sql = `
                INSERT INTO enchantment_messages 
                (wristband_code, user_name, message_text, sentiment, status, character_model, video_id, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [wristband_code, user_name, message_text, sentiment, status, character_model, video_id, today]);
            return { id: result.insertId, ...messageData };
        }
    }

    static async findByWristbandAndDate(wristband_code) {
        const today = new Date().toISOString().slice(0, 10);
        const sql = "SELECT * FROM enchantment_messages WHERE wristband_code = ? AND created_at = ?";
        const [rows] = await db.execute(sql, [wristband_code, today]);
        return rows[0];
    }
    
    static async getApprovedMessages() {
        const sql = "SELECT * FROM enchantment_messages WHERE status = 'approved' AND video_url IS NOT NULL ORDER BY id DESC LIMIT 20";
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async updateVideoUrl(videoId, videoUrl) {
        const sql = "UPDATE enchantment_messages SET video_url = ? WHERE video_id = ?";
        const [result] = await db.execute(sql, [videoUrl, videoId]);
        return result.affectedRows > 0;
    }
}

module.exports = EnchantmentModel;