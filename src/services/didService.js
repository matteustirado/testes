const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.DID_API_KEY;
const API_URL = 'https://api.d-id.com/talks';

class DidService {
    static async generateVideo(text, imageUrl) {
        if (!API_KEY) {
            console.error('[DidService] A chave da API da D-ID não foi configurada.');
            throw new Error('A API de vídeo não está configurada.');
        }

        try {
            const response = await axios.post(API_URL, {
                script: {
                    type: 'text',
                    input: text
                },
                source_url: imageUrl,
                config: {
                    result_format: 'mp4'
                },
                voice: {
                    type: 'microsoft',
                    voice_id: 'pt-BR-AntonioNeural'
                }
            }, {
                headers: {
                    'Authorization': `Basic ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.id) {
                return response.data.id;
            } else {
                throw new Error('Erro desconhecido na API da D-ID ao iniciar a geração.');
            }
        } catch (error) {
            if (error.response) {
                console.error('[DidService] Erro ao gerar vídeo:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('[DidService] Erro ao gerar vídeo:', error.message);
            }
            throw new Error('Falha ao se comunicar com o serviço de geração de vídeo.');
        }
    }

    static async getVideoStatus(talkId) {
        if (!API_KEY) {
            throw new Error('A API de vídeo não está configurada.');
        }
        const STATUS_URL = `https://api.d-id.com/talks/${talkId}`;
        try {
            const response = await axios.get(STATUS_URL, {
                headers: { 'Authorization': `Basic ${API_KEY}` }
            });

            if (response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            if (error.response) {
                console.error(`[DidService] Erro ao buscar status do vídeo ${talkId}:`, JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(`[DidService] Erro ao buscar status do vídeo ${talkId}:`, error.message);
            }
            throw new Error('Falha ao buscar status do vídeo.');
        }
    }
}

module.exports = DidService;