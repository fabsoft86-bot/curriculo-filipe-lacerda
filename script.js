document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    initializeTheme(themeToggleBtn);
    loadResume();
});

function initializeTheme(themeToggleBtn) {
    if (!themeToggleBtn) {
        return;
    }

    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    } catch (error) {
        console.warn('Não foi possível acessar a preferência de tema:', error);
    }
    setTheme(savedTheme, themeToggleBtn);

    themeToggleBtn.addEventListener('click', () => {
        const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme, themeToggleBtn);
        try {
            localStorage.setItem('theme', nextTheme);
        } catch (error) {
            console.warn('Não foi possível salvar a preferência de tema:', error);
        }
    });
}

function setTheme(theme, themeToggleBtn) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️ Modo Claro';
        themeToggleBtn.setAttribute('aria-pressed', 'true');
        return;
    }

    document.documentElement.removeAttribute('data-theme');
    themeToggleBtn.textContent = '🌙 Modo Escuro';
    themeToggleBtn.setAttribute('aria-pressed', 'false');
}

async function loadResume() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`Falha ao carregar data.json: ${response.status}`);
        }

        const data = await response.json();
        renderPerfil(data.perfil);
        renderProjetos(data.projetos);
        renderExperiencias(data.experiencias);
        renderFormacao(data.formacao);
        setupFiltros();
    } catch (error) {
        console.error('Erro ao carregar dados do currículo:', error);
        showLoadError();
    }
}

function showLoadError() {
    const main = document.querySelector('main');
    if (!main) {
        return;
    }

    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = window.location.protocol === 'file:' ?
        'Não foi possível carregar os dados. Abra o currículo por um servidor local para permitir a leitura do arquivo JSON.' :
        'Não foi possível carregar os dados do currículo. Verifique o arquivo data.json e tente novamente.';
    main.prepend(message);
}

function createExternalLink(url, label, className) {
    if (typeof url !== 'string' || !url.trim()) {
        return null;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (error) {
        return null;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return null;
    }

    const link = document.createElement('a');
    link.className = className;
    link.href = parsedUrl.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    return link;
}

function renderPerfil(perfil) {
    const headerContainer = document.getElementById('perfil-header');
    const resumoContainer = document.getElementById('perfil-resumo');
    if (!perfil || !headerContainer || !resumoContainer) {
        return;
    }

    const name = document.createElement('h1');
    name.textContent = perfil.nome || '';
    const title = document.createElement('p');
    title.className = 'subtitle';
    title.textContent = perfil.titulo || '';

    const headerContent = [name, title];
    if (Array.isArray(perfil.redes) && perfil.redes.length > 0) {
        const socialLinks = document.createElement('div');
        socialLinks.className = 'social-links';

        perfil.redes.forEach((rede) => {
                    const label = `${rede.icone ? `${rede.icone} ` : ''}${rede.nome || 'Rede social'}`;
            const link = createExternalLink(rede.url, label, 'social-btn');
            if (link) {
                socialLinks.appendChild(link);
            }
        });

        if (socialLinks.childElementCount > 0) {
            headerContent.push(socialLinks);
        }
    }
    headerContainer.replaceChildren(...headerContent);

    const summary = document.createElement('p');
    summary.textContent = perfil.resumo || '';
    resumoContainer.replaceChildren(summary);

    const metricsContainer = document.getElementById('perfil-metricas');
    if (metricsContainer) {
        const metricCards = Array.isArray(perfil.metricas)
            ? perfil.metricas.map((metrica) => {
                const card = document.createElement('div');
                card.className = 'metric-card';

                const value = document.createElement('span');
                value.className = 'metric-value';
                value.textContent = metrica.valor || '';

                const label = document.createElement('span');
                label.className = 'metric-label';
                label.textContent = metrica.rotulo || '';

                card.append(value, label);
                return card;
            })
            : [];
        metricsContainer.replaceChildren(...metricCards);
    }
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}

function renderProjetos(projetos) {
    const container = document.getElementById('projects-grid');
    if (!container) {
        return;
    }
    container.replaceChildren();

    if (!Array.isArray(projetos)) {
        return;
    }

    projetos.forEach((projeto) => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.dataset.category = Array.isArray(projeto.categorias) ? projeto.categorias.join(' ') : '';
        card.dataset.search = normalizeSearchText([
            projeto.titulo,
            projeto.descricao,
            ...(Array.isArray(projeto.tags) ? projeto.tags : [])
        ].filter(Boolean).join(' '));

        const descriptionBlock = document.createElement('div');
        const heading = document.createElement('h3');
        heading.textContent = projeto.titulo || '';
        const description = document.createElement('p');
        description.textContent = projeto.descricao || '';
        descriptionBlock.append(heading, description);

        const detailsBlock = document.createElement('div');
        const tags = document.createElement('div');
        tags.className = 'tags';
        if (Array.isArray(projeto.tags)) {
            projeto.tags.forEach((tag) => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tags.appendChild(tagElement);
            });
        }
        detailsBlock.appendChild(tags);

        const projectLinks = document.createElement('div');
        projectLinks.className = 'project-links';
        const primaryLabel = 'Acessar Projeto ↗';
        const primaryLink = createExternalLink(projeto.link, primaryLabel, 'project-link project-link-primary');
        const githubLink = createExternalLink(projeto.github, 'GitHub ↗', 'project-link project-link-github');

        if (primaryLink) {
            projectLinks.appendChild(primaryLink);
        }
        if (githubLink && (!primaryLink || githubLink.href !== primaryLink.href)) {
            projectLinks.appendChild(githubLink);
        }
        if (projectLinks.childElementCount > 0) {
            detailsBlock.appendChild(projectLinks);
        }

        card.append(descriptionBlock, detailsBlock);
        container.appendChild(card);
    });
}

function setupFiltros() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const searchInput = document.getElementById('search-input');
    const resultsStatus = document.getElementById('project-results-status');
    const emptyState = document.getElementById('projects-empty');
    let activeFilter = 'all';

    const applyFilters = () => {
        const searchTerm = normalizeSearchText(searchInput ? searchInput.value.trim() : '');
        let visibleCount = 0;

        projectCards.forEach((card) => {
            const categories = (card.dataset.category || '').split(/\s+/).filter(Boolean);
            const matchesCategory = activeFilter === 'all' || categories.includes(activeFilter);
            const matchesSearch = !searchTerm || (card.dataset.search || '').includes(searchTerm);
            const isVisible = matchesCategory && matchesSearch;
            card.style.display = isVisible ? 'flex' : 'none';
            if (isVisible) {
                visibleCount += 1;
            }
        });

        if (resultsStatus) {
            resultsStatus.textContent = visibleCount === 1
                ? '1 projeto encontrado'
                : `${visibleCount} projetos encontrados`;
        }
        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    };

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.filter || 'all';

            filterButtons.forEach((filterButton) => {
                const isActive = filterButton === button;
                filterButton.classList.toggle('active', isActive);
                filterButton.setAttribute('aria-pressed', String(isActive));
            });

            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    applyFilters();
}

function renderExperiencias(experiencias) {
    const container = document.getElementById('experience-timeline');
    if (!container) {
        return;
    }
    container.replaceChildren();

    if (!Array.isArray(experiencias)) {
        return;
    }

    experiencias.forEach((experiencia, index) => {
        const item = document.createElement('article');
        item.className = 'experience-item';

        const heading = document.createElement('h3');
        heading.className = 'experience-heading';
        const company = document.createElement('strong');
        company.textContent = experiencia.empresa || '';
        heading.appendChild(company);
        if (experiencia.cargo) {
            const role = document.createElement('span');
            role.textContent = experiencia.cargo;
            heading.append(document.createTextNode(' — '), role);
        }

        const details = document.createElement('ul');
        if (Array.isArray(experiencia.detalhes)) {
            experiencia.detalhes.forEach((detail) => {
                const listItem = document.createElement('li');
                listItem.textContent = detail;
                details.appendChild(listItem);
            });
        }
        item.append(heading, details);
        container.appendChild(item);
    });
}

function renderFormacao(formacao) {
    const container = document.getElementById('education-list');
    if (!container) {
        return;
    }
    container.replaceChildren();

    if (!Array.isArray(formacao)) {
        return;
    }

    formacao.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        container.appendChild(listItem);
    });
}