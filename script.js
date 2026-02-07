(function () {
  const outputContainer = document.querySelector('.output-container');
  const inputEl = document.querySelector('.command-input');
  const pathSpan = document.querySelector('.prompt .path');

  let currentPath = '~';
  let history = [];
  let historyIndex = -1;

  const entries = {
    '~': [
      { name: 'projects', type: 'dir' },
      { name: 'social', type: 'dir' },
      { name: 'resume', type: 'file' },
      { name: 'contact', type: 'file' },
    ],
    '~/projects': [
      { name: 'api-rest-node', type: 'dir', desc: 'REST API with Node.js' },
      { name: 'microservicos-python', type: 'dir', desc: 'Microservices with FastAPI' },
      { name: 'auth-jwt', type: 'file', desc: 'JWT authentication system' },
    ],
    '~/social': [
      { name: 'email', type: 'link', url: 'luizferreiralps@gmail.com' },
      { name: 'linkedin', type: 'link', url: 'https://www.linkedin.com/in/luizhpferreira/' },
      { name: 'github', type: 'link', url: 'https://github.com/luizhpferreira' },
      { name: 'twitter', type: 'link', url: 'https://x.com/luizferreiralp' },
    ],
    '~/projects/wallet-btc': [
      { name: 'README', type: 'file', desc: 'Project description' },
      { name: 'repo', type: 'link', url: 'https://github.com/luizhpferreira/wallet-btc' },
    ],
    '~/projects/backend-naocustodial': [
      { name: 'README', type: 'file', desc: 'Project description' },
      { name: 'repo', type: 'link', url: 'https://github.com/luizhpferreira/backend-naocustodial' },
    ],
    '~/projects/monitor-pricing-btc': [
      { name: 'README', type: 'file', desc: 'Project description' },
      { name: 'repo', type: 'link', url: 'https://github.com/luizhpferreira/monitor-pricing-btc' },
    ],
  };

  const COMMANDS = ['ls', 'cat', 'cd', 'help', 'clear'];

  const catContent = {
    resume: {
      title: 'Resume — Luiz Poldo',
      body: `
RESUMO
GO Developer. Formado em Análise e Desenvolvimento de Sistemas.


PRINCIPAIS COMPETÊNCIAS
 · Go · Java · Datadog

CERTIFICAÇÕES
· AWS Certified Solutions Architect - Associate
· The Complete Splunk Course
· Monitoramento com Zabbix
· Cisco AppDynamics Application Performance Management (APM)
· Gremlin Certified Chaos Engineering Professional (GCCEP)
· Monitoring and Alerting with Prometheus


EXPERIÊNCIA

Mercado Libre — Software Developer
dez 2024 - Presente (1 ano 3 meses) · Curitiba, PR
Desenvolvimento e manutenção de aplicações robustas e escaláveis em Java e Go, com foco em performance, confiabilidade e arquitetura limpa. Observabilidade, pipelines CI/CD de ponta a ponta e decisões técnicas que guiam o design de sistemas e a evolução da plataforma.

Stefanini Brasil — DevOps Developer
ago 2024 - dez 2024 (5 meses) · São Paulo, SP
DevOps: GitActions, ArgoCD, Terraform, Datadog, AWS Lambda, FinOps. Python e serviços AWS para otimizar infraestrutura e custos. CI/CD, automação e monitoramento em colaboração com times de desenvolvimento.

Orsegups Participações S/A — DevOps Engineer
jun 2024 - ago 2024 (3 meses) · São José, SC
Ponte entre desenvolvimento e operações: automação, infraestrutura em nuvem, pipelines CI/CD. Stack: Terraform, AWS, Docker, Kubernetes, Jenkins, Prometheus, Grafana, ELK, Datadog, Python, Bash.

NTT DATA — Site Reliability Engineer (SRE)
jul 2021 - jun 2024 (3 anos) · Florianópolis, SC
Ferramentas de automação para provisionamento e escalabilidade. SRE desde o início do ciclo de desenvolvimento. Monitoramento proativo e resolução rápida de incidentes. Instrutor de robótica no projeto RecPam.

FORMAÇÃO
· Estácio — Análise e Desenvolvimento de Sistemas (2021–2023)
· UFSC — Letras, Educação (2017)


      `.trim(),
    },
    contact: {
      title: 'Contact',
      body: `
Email: luizferreiralps@gmail.com
LinkedIn: www.linkedin.com/in/luizhpferreira
GitHub: github.com/luizhpferreira

Disponível para projetos e oportunidades em backend, Go, Java e DevOps/SRE.
      `.trim(),
    },
    social: {
      title: 'Social',
      body: `
Email: luizferreiralps@gmail.com

Type: cat email | cat linkedin | cat github | cat twitter
Or use: ls to list available links.
      `.trim(),
    },
    projects: {
      title: 'Projects',
      body: `
Type: cd projects and then ls to list projects.
      `.trim(),
    },
    readme: {
      title: 'README',
      body: `
REST API with Node.js (or current project).
Stack: Node.js, Express, database.
Use cat repo to open the repository on GitHub.
      `.trim(),
    },
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function addBlock(replayText, content) {
    const block = document.createElement('div');
    block.className = 'output-block';
    if (replayText !== undefined) {
      const replay = document.createElement('div');
      replay.className = 'replay';
      replay.innerHTML = replayText;
      block.appendChild(replay);
    }
    if (typeof content === 'string') {
      const pre = document.createElement('pre');
      pre.className = 'line';
      pre.textContent = content;
      block.appendChild(pre);
    } else if (content instanceof HTMLElement) {
      block.appendChild(content);
    } else if (content) {
      const pre = document.createElement('pre');
      pre.className = 'line';
      pre.appendChild(content);
      block.appendChild(pre);
    }
    outputContainer.appendChild(block);
  }

  function promptText() {
    return `<span class="prompt-inline">visitor@portifolio:${currentPath}$</span> ${escapeHtml(inputEl.value.trim() || ' ')}`;
  }

  function getCurrentList() {
    const key = currentPath === '~' ? '~' : currentPath;
    return entries[key] || entries['~'] || [];
  }

  function findEntryByName(list, name, type) {
    const lower = name.toLowerCase();
    return list.find((e) => e.name.toLowerCase() === lower && (!type || e.type === type));
  }

  function getCompletions(prefix, partIndex, command) {
    const lower = prefix.toLowerCase();
    if (partIndex === 0) {
      return COMMANDS.filter((c) => c.startsWith(lower));
    }
    const list = getCurrentList();
    let names = list.map((e) => e.name);
    if (command === 'cd') {
      names = list.filter((e) => e.type === 'dir').map((e) => e.name);
    } else {
      const forCat = Object.keys(catContent);
      names = [...new Set([...names, ...forCat])];
    }
    return names.filter((n) => n.toLowerCase().startsWith(lower));
  }

  function resolveName(entryList, arg) {
    const entry = entryList.find((e) => e.name.toLowerCase() === arg.toLowerCase());
    return entry ? entry.name : null;
  }

  function resolveCatContentKey(arg) {
    const key = Object.keys(catContent).find((k) => k.toLowerCase() === arg.toLowerCase());
    return key || null;
  }

  function handleTab() {
    const val = inputEl.value;
    const start = inputEl.selectionStart;
    const before = val.substring(0, start);
    const parts = before.trim().split(/\s+/);
    const partIndex = parts.length <= 1 ? 0 : 1;
    const command = (parts[0] || '').toLowerCase();
    const prefix = (parts[parts.length - 1] || '').toLowerCase();
    const wordStart = before.length - (parts[parts.length - 1] || '').length;

    const completions = getCompletions(prefix, partIndex, command);
    if (completions.length === 0) return;

    const completion = completions.length === 1
      ? completions[0]
      : completions.reduce((acc, n) => {
          const a = acc.toLowerCase();
          const b = n.toLowerCase();
          let i = 0;
          while (a[i] === b[i] && i < Math.min(a.length, b.length)) i++;
          return a.substring(0, i);
        });
    const canonical = completions.find((c) => c.toLowerCase() === completion.toLowerCase()) || completion;
    const newVal = val.substring(0, wordStart) + canonical + (completions.length === 1 ? ' ' : '') + val.substring(start);
    inputEl.value = newVal;
    inputEl.setSelectionRange(wordStart + canonical.length + (completions.length === 1 ? 1 : 0), inputEl.selectionEnd);
  }

  function runCommand(cmd) {
    const parts = cmd.trim().split(/\s+/);
    const name = parts[0]?.toLowerCase();
    const arg = parts[1];

    if (!name) {
      addBlock(promptText(), '');
      return;
    }

    if (name === 'clear') {
      outputContainer.innerHTML = '';
      return;
    }

    if (name === 'help') {
      addBlock(promptText(), `Available commands:
  ls              List files and folders
  cat <file>      Show content (e.g. cat resume, cat contact)
  cd <folder>     Enter folder (e.g. cd projects, cd social)
  cd ..           Go back to previous folder
  help            Show this message
  clear           Clear the terminal`);
      return;
    }

    if (name === 'ls') {
      const key = currentPath.replace(/^~/, '~');
      const list = entries[key] || entries['~'];
      if (!list) {
        addBlock(promptText(), '');
        return;
      }
      const pre = document.createElement('pre');
      pre.className = 'line';
      list.forEach((e) => {
        const span = document.createElement('span');
        span.className = 'line';
        if (e.type === 'dir') {
          span.innerHTML = `<span class="dir">${escapeHtml(e.name)}/</span>`;
        } else {
          span.innerHTML = `<span class="file">${escapeHtml(e.name)}</span>`;
        }
        if (e.desc) span.appendChild(document.createTextNode(`  — ${e.desc}`));
        pre.appendChild(span);
        pre.appendChild(document.createTextNode('\n'));
      });
      addBlock(promptText(), pre);
      return;
    }

    if (name === 'cd') {
      if (!arg || arg === '~') {
        currentPath = '~';
        pathSpan.textContent = '~';
        addBlock(promptText(), '');
        return;
      }
      if (arg === '..') {
        if (currentPath !== '~') {
          const parts = currentPath.replace(/^~\//, '').split('/');
          parts.pop();
          currentPath = parts.length ? '~/' + parts.join('/') : '~';
          pathSpan.textContent = currentPath;
        }
        addBlock(promptText(), '');
        return;
      }
      const key = currentPath === '~' ? '~' : currentPath;
      const list = entries[key];
      const entryDir = list && findEntryByName(list, arg, 'dir');
      const entryAny = list && findEntryByName(list, arg, null);
      if (entryDir) {
        currentPath = currentPath === '~' ? `~/${entryDir.name}` : `${currentPath}/${entryDir.name}`;
        pathSpan.textContent = currentPath;
        addBlock(promptText(), '');
      } else if (entryAny && entryAny.type === 'file') {
        addBlock(promptText(), '');
        addBlock('', `<span class="error-msg">bash: cd: ${escapeHtml(arg)}: Not a directory. Use <strong>cat ${escapeHtml(entryAny.name)}</strong> to view content.</span>`);
      } else {
        addBlock(promptText(), '');
        addBlock('', `<span class="error-msg">bash: cd: ${escapeHtml(arg)}: No such file or directory</span>`);
      }
      return;
    }

    if (name === 'cat') {
      if (!arg) {
        addBlock(promptText(), '');
        addBlock('', '<span class="error-msg">Usage: cat &lt;file&gt;</span>');
        return;
      }
      const key = currentPath === '~' ? '~' : currentPath;
      const list = entries[key] || entries['~'];
      const entry = list && findEntryByName(list, arg, null);
      if (entry && entry.type === 'link') {
        const div = document.createElement('div');
        div.className = 'cat-content';
        div.innerHTML = `<h4>${escapeHtml(entry.name)}</h4><p><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.url)}</a></p>`;
        addBlock(promptText(), div);
        return;
      }
      const contentKey = resolveCatContentKey(arg);
      const content = contentKey ? catContent[contentKey] : null;
      if (content) {
        const div = document.createElement('div');
        div.className = 'cat-content';
        div.innerHTML = `<h4>${escapeHtml(content.title)}</h4><p>${escapeHtml(content.body).replace(/\n/g, '<br>')}</p>`;
        addBlock(promptText(), div);
        return;
      }
      addBlock(promptText(), '');
      addBlock('', `<span class="error-msg">cat: ${escapeHtml(arg)}: No such file or directory</span>`);
      return;
    }

    addBlock(promptText(), '');
    addBlock('', `<span class="error-msg">Command not found: ${escapeHtml(name)}. Type help to see commands.</span>`);
  }

  function submit() {
    const cmd = inputEl.value.trim();
    if (!cmd) return;
    history.push(cmd);
    historyIndex = history.length;
    runCommand(cmd);
    inputEl.value = '';
    outputContainer.scrollTop = outputContainer.scrollHeight;
  }

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTab();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIndex > 0) historyIndex--;
      inputEl.value = history[historyIndex];
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        inputEl.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        inputEl.value = '';
      }
      return;
    }
  });

  inputEl.focus();
})();
