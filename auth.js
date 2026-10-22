document.addEventListener('DOMContentLoaded', () => {
    // Seleção de Elementos
    const tabLogin = document.getElementById('tabLogin');
    const tabCadastro = document.getElementById('tabCadastro');
    const formLogin = document.getElementById('formLogin');
    const formCadastro = document.getElementById('formCadastro');
    const authMessage = document.getElementById('authMessage');

    // 1. Alternar entre as abas Login e Cadastro
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabCadastro.classList.remove('active');
        formLogin.classList.remove('hidden');
        formCadastro.classList.add('hidden');
        exibirMensagem('', '');
    });

    tabCadastro.addEventListener('click', () => {
        tabCadastro.classList.add('active');
        tabLogin.classList.remove('active');
        formCadastro.classList.remove('hidden');
        formLogin.classList.add('hidden');
        exibirMensagem('', '');
    });

    // Função Auxiliar de Mensagens
    function exibirMensagem(texto, tipo) {
        authMessage.textContent = texto;
        authMessage.className = 'auth-message';
        if (tipo) {
            authMessage.classList.add(tipo);
        }
    }

    // 2. LÓGICA DE CADASTRO DE USUÁRIO
    formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('cadNome').value.trim();
        const email = document.getElementById('cadEmail').value.trim().toLowerCase();
        const password = document.getElementById('cadSenha').value;

        // Buscar usuários já cadastrados no localStorage
        const usuarios = JSON.parse(localStorage.getItem('devforum_users')) || [];

        // Verificar se e-mail ou username já existem
        const usuarioExiste = usuarios.some(u => u.email === email || u.username === username);

        if (usuarioExiste) {
            exibirMensagem('E-mail ou nome de usuário já cadastrado!', 'error');
            return;
        }

        // Criar novo usuário
        const novoUsuario = {
            id: Date.now(),
            username: username,
            email: email,
            password: password // Em ambiente real usaria hash, no protótipo fica assim
        };

        usuarios.push(novoUsuario);
        localStorage.setItem('devforum_users', JSON.stringify(usuarios));

        exibirMensagem('Conta criada com sucesso! Redirecionando para login...', 'success');
        formCadastro.reset();

        // Volta automaticamente para a aba de Login após 1.5s
        setTimeout(() => {
            tabLogin.click();
        }, 1500);
    });

    // 3. LÓGICA DE LOGIN E SESSÃO
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginSenha').value;

        const usuarios = JSON.parse(localStorage.getItem('devforum_users')) || [];

        // Procurar usuário correspondente
        const usuarioValido = usuarios.find(u => u.email === email && u.password === password);

        if (!usuarioValido) {
            exibirMensagem('E-mail ou senha incorretos!', 'error');
            return;
        }

        // Salvar a SESSÃO ATIVA (usuário logado)
        localStorage.setItem('devforum_logged_user', JSON.stringify({
            id: usuarioValido.id,
            username: usuarioValido.username,
            email: usuarioValido.email
        }));

        exibirMensagem(`Bem-vindo, @${usuarioValido.username}! Entrando...`, 'success');

        // Redireciona para o Feed Principal (index.html)
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
    });
});