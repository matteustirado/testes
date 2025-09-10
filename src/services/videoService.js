const { VideoGenerator } = require('@heygen/video-generator');
require('dotenv').config();

const API_KEY = process.env.HEYGEN_API_KEY;

class VideoService {
    static async generateVideo(text, avatarId) {
        if (!API_KEY) {
            console.error('[VideoService] A chave da API da HeyGen não foi configurada.');
            throw new Error('A API de vídeo não está configurada.');
        }

        try {
            const videoGenerator = new VideoGenerator(API_KEY);

            const result = await videoGenerator.createVideo({
                video_inputs: [{
                    character: {
                        type: 'avatar',
                        avatar_id: avatarId,
                    },
                    voice: {
                        type: 'text',
                        input_text: text,
                        voice_id: 'Antonio-pt-BR' 
                    }
                }],
                test: true,
                dimension: {
                    width: 1920,
                    height: 1080
                }
            });

            return result.data.video_id;

        } catch (error) {
            console.error(`[VideoService] Erro ao gerar vídeo com a HeyGen:`, error.response ? error.response.data : error.message);
            throw new Error('Falha ao se comunicar com o serviço de geração de vídeo.');
        }
    }

    static async getVideoStatus(videoId) {
        if (!API_KEY) {
            throw new Error('A API de vídeo não está configurada.');
        }
        try {
            const videoGenerator = new VideoGenerator(API_KEY);
            const result = await videoGenerator.getVideoStatus(videoId);
            return result.data;
        } catch (error) {
            console.error(`[VideoService] Erro ao buscar status do vídeo ${videoId}:`, error.response ? error.response.data : error.message);
            throw new Error('Falha ao buscar status do vídeo.');
        }
    }
}

module.exports = VideoService;