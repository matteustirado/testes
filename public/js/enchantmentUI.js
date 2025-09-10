document.addEventListener('DOMContentLoaded', () => {
    const formView = document.getElementById('form-view');
    const responseView = document.getElementById('response-view');
    const wristbandInput = document.getElementById('wristband-code');
    const nameInput = document.getElementById('user-name');
    const messageInput = document.getElementById('message-text');
    const submitBtn = document.getElementById('submit-message-btn');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const responseIcon = document.getElementById('response-icon');
    const responseTitle = document.getElementById('response-title');
    const responseText = document.getElementById('response-text');
    const backToFormBtn = document.getElementById('back-to-form-btn');
    const characterModal = document.getElementById('character-modal');
    const characterList = document.getElementById('character-list');

    const characterModels = [
        { id: 'https://i.imgur.com/mu3nQpE.jpeg', name: 'Homem', image: 'assets/img/teste.jpeg' },
    ];

    const positiveKeywords = ['bom', 'ótimo', 'incrível', 'amei', 'adoro', 'perfeito', 'lindo', 'maravilhoso', 'excelente', 'top', 'demais', 'curti', 'amor', 'feliz', 'parabéns'];
    const negativeKeywords = ['ruim', 'péssimo', 'odeio', 'lixo', 'horrível', 'terrível', 'problema', 'demora', 'caro', 'reclamar', 'merda', 'bosta', 'chato'];

    const analyzeSentimentLocally = (text) => {
        const lowerCaseText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;

        positiveKeywords.forEach(word => {
            if (lowerCaseText.includes(word)) positiveScore++;
        });

        negativeKeywords.forEach(word => {
            if (lowerCaseText.includes(word)) negativeScore++;
        });

        if (negativeScore > 0) return 'negative';
        if (positiveScore > 0) return 'positive';
        return 'neutral';
    };

    const showView = (view) => {
        formView.classList.add('hidden');
        responseView.classList.add('hidden');
        view.classList.remove('hidden');
    };

    const showResponse = (type, title, message) => {
        responseTitle.textContent = title;
        responseText.textContent = message;
        responseIcon.className = '';
        if (type === 'success') {
            responseIcon.classList.add('fas', 'fa-check-circle', 'success');
        } else {
            responseIcon.classList.add('fas', 'fa-info-circle', 'info');
        }
        showView(responseView);
    };
    
    const resetForm = () => {
        wristbandInput.value = '';
        nameInput.value = '';
        messageInput.value = '';
        submitBtn.disabled = false;
        submitBtnText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
        showView(formView);
    };

    const populateCharacterModal = () => {
        characterList.innerHTML = '';
        characterModels.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.characterId = char.id;
            card.innerHTML = `
                <img src="${char.image}" alt="${char.name}">
                <p>${char.name}</p>
            `;
            card.addEventListener('click', () => handleCharacterSelection(char.id));
            characterList.appendChild(card);
        });
        characterModal.classList.remove('hidden');
    };
    
    const submitData = async (characterId = null) => {
        submitBtn.disabled = true;
        submitBtnText.classList.add('hidden');
        submitSpinner.classList.remove('hidden');

        const payload = {
            wristband_code: wristbandInput.value.trim(),
            user_name: nameInput.value.trim(),
            message_text: messageInput.value.trim(),
            character_model: characterId
        };

        try {
            await apiFetch('/enchantment', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            if (characterId) {
                showResponse('success', 'Tudo Certo!', 'Sua mensagem foi enviada para a nossa IA e logo aparecerá no telão. Fique de olho!');
            } else {
                 showResponse('info', 'Mensagem Recebida!', 'Olha, fico feliz que você comentou isso aqui. Essa é uma questão mais única, então vou separá-la para ser analisada e resolvida. Sua questão não vai passar batida.');
            }
        } catch (error) {
            showResponse('info', 'Ops!', error.message || 'Não foi possível enviar sua mensagem.');
        } finally {
            submitBtn.disabled = false;
            submitBtnText.classList.remove('hidden');
            submitSpinner.classList.add('hidden');
        }
    };
    
    const handleCharacterSelection = (characterId) => {
        characterModal.classList.add('hidden');
        submitData(characterId);
    };

    submitBtn.addEventListener('click', async () => {
        if (!wristbandInput.value.trim() || !nameInput.value.trim() || !messageInput.value.trim()) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const sentiment = analyzeSentimentLocally(messageInput.value.trim());

        if (sentiment === 'negative') {
            submitData(null);
        } else {
            populateCharacterModal();
        }
    });

    backToFormBtn.addEventListener('click', resetForm);
});