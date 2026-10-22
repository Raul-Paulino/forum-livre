document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICAÇÃO DE SESSÃO / USUÁRIO LOGADO
    const loggedUser = JSON.parse(localStorage.getItem('devforum_logged_user'));

    if (!loggedUser) {
        window.location.href = 'login.html';
        return;
    }

    const userNameDisplay = document.getElementById('userNameDisplay');
    const btnLogout = document.getElementById('btnLogout');

    userNameDisplay.textContent = `@${loggedUser.username}`;

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('devforum_logged_user');
        window.location.href = 'login.html';
    });

    // 2. ELEMENTOS DO FEED
    const formCreatePost = document.getElementById('formCreatePost');
    const postTitle = document.getElementById('postTitle');
    const postCategory = document.getElementById('postCategory');
    const postContent = document.getElementById('postContent');
    const feedList = document.getElementById('feedList');
    const inputBusca = document.getElementById('inputBusca');
    const categoryItems = document.querySelectorAll('.category-list li');

    let categoriaAtual = 'todos';
    let postEmEdicaoId = null;

    // 3. RENDERIZAR POSTS
    function carregarPosts() {
        const posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
        feedList.innerHTML = '';

        const termoBusca = inputBusca.value.toLowerCase().trim();

        const postsFiltrados = posts.filter(post => {
            const bateCategoria = (categoriaAtual === 'todos' || post.category === categoriaAtual);
            const bateBusca = post.title.toLowerCase().includes(termoBusca) || 
                              post.content.toLowerCase().includes(termoBusca) || 
                              post.author.toLowerCase().includes(termoBusca);
            return bateCategoria && bateBusca;
        });

        if (postsFiltrados.length === 0) {
            feedList.innerHTML = `
                <div class="post-card" style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    <p>Nenhuma publicação encontrada.</p>
                </div>
            `;
            return;
        }

        postsFiltrados.reverse().forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.id = `post-card-${post.id}`;

            const eMeuPost = post.authorId === loggedUser.id;
            const comentarios = post.comments || [];

            if (postEmEdicaoId === post.id) {
                card.innerHTML = `
                    <div class="edit-post-form">
                        <h3>✏️ Editar Publicação</h3>
                        <input type="text" id="edit-title-${post.id}" value="${post.title}" required>
                        <select id="edit-category-${post.id}">
                            <option value="tecnologia" ${post.category === 'tecnologia' ? 'selected' : ''}>💻 Tecnologia</option>
                            <option value="geral" ${post.category === 'geral' ? 'selected' : ''}>💬 Geral</option>
                            <option value="fitness" ${post.category === 'fitness' ? 'selected' : ''}>🏋️‍♂️ Fitness</option>
                            <option value="setup" ${post.category === 'setup' ? 'selected' : ''}>🖥️ Setup</option>
                        </select>
                        <textarea id="edit-content-${post.id}" rows="3" required>${post.content}</textarea>
                        <div class="edit-actions">
                            <button class="btn-primary btn-sm" onclick="salvarEdicao(${post.id})">Salvar Alterações</button>
                            <button class="btn-secondary btn-sm" onclick="cancelarEdicao()">Cancelar</button>
                        </div>
                    </div>
                `;
            } else {
                let comentariosHTML = '';
                if (comentarios.length > 0) {
                    comentariosHTML = comentarios.map(c => {
                        const eMeuComentario = c.authorId === loggedUser.id || eMeuPost;
                        return `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <span class="comment-author">@${c.author}</span>
                                    ${eMeuComentario ? `<button class="btn-delete-comment" onclick="deletarComentario(${post.id},${c.id})">✖</button>` : ''}
                                </div>
                                <p class="comment-text">${c.text}</p>
                            </div>
                        `;
                    }).join('');
                } else {
                    comentariosHTML = `<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a responder!</p>`;
                }

                card.innerHTML = `
                    <div class="post-header">
                        <span class="post-author">@${post.author}</span>
                        <span class="post-category-tag">#${post.category}</span>
                    </div>
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-content">${post.content}</p>
                    <div class="post-actions">
                        <button class="btn-action btn-like" onclick="curtirPost(${post.id})">
                            ❤️ <span>${post.likes || 0}</span>
                        </button>
                        <button class="btn-action" onclick="toggleComentarios(${post.id})">
                            💬 <span>${comentarios.length}</span> Comentários
                        </button>
                        ${eMeuPost ? `
                            <button class="btn-action btn-edit" onclick="ativarEdicao(${post.id})">✏️ Editar</button>
                            <button class="btn-action btn-delete" onclick="deletarPost(${post.id})">🗑️ Excluir</button>
                        ` : ''}
                    </div>

                    <div id="comments-section-${post.id}" class="comments-section hidden">
                        <div class="comments-list">
                            ${comentariosHTML}
                        </div>
                        <form class="comment-form" onsubmit="adicionarComentario(event, ${post.id})">
                            <input type="text" id="comment-input-${post.id}" placeholder="Escreva um comentário..." required>
                            <button type="submit" class="btn-primary btn-sm">Responder</button>
                        </form>
                    </div>
                `;
            }

            feedList.appendChild(card);
        });
    }

    // 4. CRIAR NOVO POST
    formCreatePost.addEventListener('submit', (e) => {
        e.preventDefault();

        const novoPost = {
            id: Date.now(),
            author: loggedUser.username,
            authorId: loggedUser.id,
            title: postTitle.value.trim(),
            category: postCategory.value,
            content: postContent.value.trim(),
            likes: 0,
            comments: [],
            date: new Date().toLocaleDateString('pt-BR')
        };

        const posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
        posts.push(novoPost);
        localStorage.setItem('devforum_posts', JSON.stringify(posts));

        formCreatePost.reset();
        carregarPosts();
    });

    // 5. CATEGORIAS
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            categoriaAtual = item.getAttribute('data-category');
            carregarPosts();
        });
    });

    // 6. BUSCA
    inputBusca.addEventListener('input', () => {
        carregarPosts();
    });

    // 7. FUNÇÕES DE EDIÇÃO
    window.ativarEdicao = (postId) => {
        postEmEdicaoId = postId;
        carregarPosts();
    };

    window.cancelarEdicao = () => {
        postEmEdicaoId = null;
        carregarPosts();
    };

    window.salvarEdicao = (postId) => {
        const titleInput = document.getElementById(`edit-title-${postId}`).value.trim();
        const categoryInput = document.getElementById(`edit-category-${postId}`).value;
        const contentInput = document.getElementById(`edit-content-${postId}`).value.trim();

        if (!titleInput || !contentInput) return;

        let posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
        posts = posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    title: titleInput,
                    category: categoryInput,
                    content: contentInput
                };
            }
            return post;
        });

        localStorage.setItem('devforum_posts', JSON.stringify(posts));
        postEmEdicaoId = null;
        carregarPosts();
    };

    // 8. OUTRAS FUNÇÕES GLOBAIS
    window.curtirPost = (postId) => {
        let posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
        posts = posts.map(post => {
            if (post.id === postId) {
                post.likes = (post.likes || 0) + 1;
            }
            return post;
        });
        localStorage.setItem('devforum_posts', JSON.stringify(posts));
        carregarPosts();
    };

    window.toggleComentarios = (postId) => {
        const section = document.getElementById(`comments-section-${postId}`);
        if (section) {
            section.classList.toggle('hidden');
        }
    };

    window.adicionarComentario = (e, postId) => {
        e.preventDefault();
        const input = document.getElementById(`comment-input-${postId}`);
        const texto = input.value.trim();

        if (!texto) return;

        let posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
        posts = posts.map(post => {
            if (post.id === postId) {
                if (!post.comments) post.comments = [];
                post.comments.push({
                    id: Date.now(),
                    author: loggedUser.username,
                    authorId: loggedUser.id,
                    text: texto
                });
            }
            return post;
        });

        localStorage.setItem('devforum_posts', JSON.stringify(posts));
        carregarPosts();
        setTimeout(() => {
            window.toggleComentarios(postId);
        }, 50);
    };

    window.deletarComentario = (postId, commentId) => {
        let posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
        posts = posts.map(post => {
            if (post.id === postId && post.comments) {
                post.comments = post.comments.filter(c => c.id !== commentId);
            }
            return post;
        });
        localStorage.setItem('devforum_posts', JSON.stringify(posts));
        carregarPosts();
        setTimeout(() => {
            window.toggleComentarios(postId);
        }, 50);
    };

    window.deletarPost = (postId) => {
        if (confirm('Tem certeza que deseja excluir esta publicação?')) {
            let posts = JSON.parse(localStorage.getItem('devforum_posts')) || [];
            posts = posts.filter(post => post.id !== postId);
            localStorage.setItem('devforum_posts', JSON.stringify(posts));
            carregarPosts();
        }
    };

    carregarPosts();
});