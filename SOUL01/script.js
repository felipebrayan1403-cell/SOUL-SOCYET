import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJGofPIxeteOa_a0NUCxfTRNInUYQgGyE",
  authDomain: "soul-1a874.firebaseapp.com",
  projectId: "soul-1a874",
  storageBucket: "soul-1a874.firebasestorage.app",
  messagingSenderId: "611126512293",
  appId: "1:611126512293:web:59291147c8f11e5a4d9b4c",
  measurementId: "G-48CQX2J2HE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Dados estáticos iniciais do Plantel
const members = [
    { discord: 'Lima', gameName: 'Lima' },
    { discord: 'FXP', gameName: 'FXP' }
];

function membersRender(lista = members){
    const container = document.getElementById('members');
    if (!container) return;

    const dados = lista || [];

    container.innerHTML = dados.map(m => {
        const pontos = Math.max(0, Number(m.pontos) || 0);

        return `
        <article class='member'>
            <span class='member-label'>DISCORD</span>
            <b>${escapeHtml(m.discord || 'Não informado')}</b>

            <span class='member-label'>NOME NO GAME</span>
            <strong>${escapeHtml(m.gameName || m.username || 'Não informado')}</strong>

            <div class='member-pontos'>
                <span>
                    <span class='member-label'>PONTOS</span>
                    <strong>${pontos}</strong>
                </span>

                ${isAdminAtual ? `
                    <div class='pontos-controles'>
                        <button
                            class='ponto-btn'
                            title='Remover 1 ponto'
                            onclick="window.removerPontos('${m.id}')">
                            −
                        </button>

                        <button
                            class='ponto-btn'
                            title='Adicionar 1 ponto'
                            onclick="window.adicionarPonto('${m.id}')">
                            +
                        </button>
                    </div>
                ` : ''}
            </div>
        </article>
        `;
    }).join('');

    renderizarRanking(dados);
}

async function carregarMembrosPublicos() {
    try {
        const snap = await getDocs(collection(db, 'membros'));
        const lista = [];

        snap.forEach(d => lista.push({
            id: d.id,
            ...d.data()
        }));

        if (lista.length) {
            membersRender(lista);
        } else {
            membersRender(members);
        }

    } catch (e) {
        console.error('Erro ao carregar membros:', e);
        membersRender(members);
    }
}

function renderizarRanking(lista) {
    const container = document.getElementById('ranking-lista');

    if (!container) return;

    const ranking = [...(lista || [])].sort(
        (a, b) => (Number(b.pontos) || 0) - (Number(a.pontos) || 0)
    );

    if (!ranking.length) {
        container.innerHTML =
            "<p style='color:#777'>Nenhum membro registado.</p>";
        return;
    }

    container.innerHTML = ranking.map((m, index) => `
        <div class='ranking-item'>
            <span class='ranking-pos'>
                #${index + 1}
            </span>

            <span class='ranking-nome'>
                ${escapeHtml(m.gameName || m.username || 'Sem nome')}
            </span>

            <span class='ranking-pontos'>
                ${Math.max(0, Number(m.pontos) || 0)} pts
            </span>
        </div>
    `).join('');
}

carregarMembrosPublicos();
carregarTorneios();

window.openModal = () =>
    document.getElementById('modal').style.display = 'grid';

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';

    document
        .getElementById('tourTierCustom')
        .classList.add('escondido');

    document.getElementById('tourTierCustom').value = '';
};

window.fecharLogin = () =>
    document.getElementById('modalLogin').style.display = 'none';

let dadosHAsMembros = [];
let dadosTorneios = [];

window.verificarOutraTier = (valor) => {

    const inputCustom =
        document.getElementById('tourTierCustom');

    if (valor === 'outro') {

        inputCustom.classList.remove('escondido');
        inputCustom.focus();

    } else {

        inputCustom.classList.add('escondido');
        inputCustom.value = '';

    }
};

window.fazerLogin = async () => {

    const email =
        document.getElementById('adminEmail').value.trim();

    const pass =
        document.getElementById('adminPass').value.trim();

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            pass
        );

        window.fecharLogin();

        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPass').value = '';

    } catch (error) {

        alert(
            "Erro no login: E-mail ou palavra-passe incorretos."
        );

    }
};

window.abrirLogin = () => {

    if (auth.currentUser) {

        signOut(auth);
        alert("Sessão terminada.");

    } else {

        document.getElementById('modalLogin').style.display = 'grid';

    }
};

let isAdminAtual = false;
let isMembroAtual = false;

const ADMIN_EMAIL = 'admin@soul.com';

async function verificarPermissaoMembro(user) {

    if (!user) return false;

    if (user.email === ADMIN_EMAIL) return true;

    const snap =
        await getDoc(doc(db, "membros", user.uid));

    return snap.exists() &&
        snap.data().ativo !== false;
}

function atualizarAcessoInterface() {

    const navMembros =
        document.getElementById('navMembros');

    const areaMembros =
        document.getElementById('area-membros-clã');

    const navGerenciar =
        document.getElementById('navGerenciarMembros');

    const areaGerenciar =
        document.getElementById('area-gerenciar-membros');

    const btnTorneio =
        document.getElementById('btnCriarTorneio');

    navMembros?.classList.toggle(
        'escondido',
        !isMembroAtual
    );

    areaMembros?.classList.toggle(
        'escondido',
        !isMembroAtual
    );

    navGerenciar?.classList.toggle(
        'escondido',
        !isAdminAtual
    );

    areaGerenciar?.classList.toggle(
        'escondido',
        !isAdminAtual
    );

    btnTorneio?.classList.toggle(
        'escondido',
        !isAdminAtual
    );
}

onAuthStateChanged(auth, async (user) => {

    const statusText =
        document.getElementById('statusText');

    const statusDot =
        document.getElementById('statusDot');

    isAdminAtual = false;
    isMembroAtual = false;

    if (user) {

        isAdminAtual =
            user.email === ADMIN_EMAIL;

        isMembroAtual =
            isAdminAtual ||
            await verificarPermissaoMembro(user);

        statusText.innerText =
            `LOGADO: ${user.email
                .split('@')[0]
                .toUpperCase()}`;

        statusDot.style.background =
            isAdminAtual
                ? "#ff3333"
                : "#61a0ff";

        atualizarAcessoInterface();

        if (isAdminAtual) {

            criarPainelAdmin();
            criarPainelGerenciarMembros();

            await carregarMembrosAdmin();

        } else {

            removerPainelAdmin();
            removerPainelGerenciarMembros();

        }

        if (isMembroAtual)
            await carregarHAsMembros();

    } else {

        statusText.innerText = "LOGIN";
        statusDot.style.background = "#63b875";

        atualizarAcessoInterface();

        removerPainelAdmin();
        removerPainelGerenciarMembros();

        const lista =
            document.getElementById('lista-has-membros');

        if (lista)
            lista.innerHTML = '';

    }
});


// =====================================================
// TORNEIOS
// =====================================================

async function carregarTorneios() {

    try {

        const querySnapshot =
            await getDocs(collection(db, "torneios"));

        dadosTorneios = [];

        querySnapshot.forEach((doc) => {

            dadosTorneios.push({
                id: doc.id,
                ...doc.data()
            });

        });

        renderizarTorneios(dadosTorneios);

    } catch (e) {

        console.error(
            "Erro ao carregar torneios:",
            e
        );

        const container =
            document.getElementById('tours');

        if (container)
            container.innerHTML =
                "<p style='color:#777'>Erro ao carregar torneios.</p>";
    }
}

function renderizarTorneios(dados) {

    const container =
        document.getElementById('tours');

    if (!container) return;

    if (dados.length === 0) {

        container.innerHTML =
            "<p style='color:#777'>Nenhum torneio registado.</p>";

        return;
    }

    container.innerHTML = dados.map(d => `

        <article class='tour'>

            <span style='color:var(--red2); font-size:10px; font-weight:700; text-transform:uppercase;'>
                ${d.tier || 'Geral'}
            </span>

            <h3>${d.nome}</h3>

            <p style='color:#aaa; font-size:11px; margin:8px 0;'>
                📅 ${d.dia}
                &nbsp;|&nbsp;
                ⏰ ${d.horario}
            </p>

            ${
                isAdminAtual
                ?
                `<button
                    class="btn delete-btn"
                    onclick="window.excluirTorneio('${d.id}')">
                    EXCLUIR TORNEIO
                </button>`
                :
                ''
            }

        </article>

    `).join('');
}

window.adicionarTorneio = async () => {

    if (!isAdminAtual) {

        alert(
            "Apenas o Admin pode criar torneios."
        );

        return;
    }

    const nome =
        document.getElementById('tourNome').value.trim();

    const dia =
        document.getElementById('tourDia').value.trim();

    const horario =
        document.getElementById('tourHorario').value.trim();

    const selectTier =
        document.getElementById('tourTier').value;

    const customTier =
        document.getElementById('tourTierCustom').value.trim();

    let tierFinal = selectTier;

    if (selectTier === 'outro') {
        tierFinal = customTier;
    }

    if (!nome || !dia || !horario || !tierFinal) {

        alert(
            "Preencha todos os campos e defina a tier do torneio!"
        );

        return;
    }

    try {

        await addDoc(
            collection(db, "torneios"),
            {
                nome,
                dia,
                horario,
                tier: tierFinal,
                createdAt: new Date().toISOString()
            }
        );

        alert(
            "Torneio adicionado com sucesso!"
        );

        document.getElementById('tourNome').value = '';
        document.getElementById('tourDia').value = '';
        document.getElementById('tourHorario').value = '';
        document.getElementById('tourTier').value = '';
        document.getElementById('tourTierCustom').value = '';

        document
            .getElementById('tourTierCustom')
            .classList.add('escondido');

        window.closeModal();

        await carregarTorneios();

    } catch (e) {

        console.error(
            "Erro ao adicionar torneio:",
            e
        );

        alert(
            "Erro ao adicionar torneio. Verifique as regras do Firestore."
        );
    }
};

window.excluirTorneio = async (id) => {

    if (!isAdminAtual)
        return alert(
            "Apenas o Admin pode excluir torneios."
        );

    if (!confirm(
        "Excluir este torneio? Esta ação não pode ser desfeita."
    ))
        return;

    try {

        await deleteDoc(
            doc(db, "torneios", id)
        );

        await carregarTorneios();

    } catch (e) {

        console.error(
            "Erro ao excluir torneio:",
            e
        );

        alert(
            "Erro ao excluir torneio. Verifique as regras do Firestore."
        );
    }
};


// =====================================================
// HAs
// =====================================================

async function carregarHAsMembros() {

    try {

        const querySnapshot =
            await getDocs(collection(db, "user_has"));

        dadosHAsMembros = [];

        querySnapshot.forEach((doc) => {

            dadosHAsMembros.push({
                id: doc.id,
                ...doc.data()
            });

        });

        renderizarHAsMembros(dadosHAsMembros);

    } catch (e) {

        console.error(
            "Erro ao carregar HAs:",
            e
        );

        const lista =
            document.getElementById('lista-has-membros');

        if (lista)
            lista.innerHTML =
                "<p style='color:#777'>Erro ao carregar dados da base de dados.</p>";
    }
}

function renderizarHAsMembros(dados) {

    const container =
        document.getElementById('lista-has-membros');

    if (!container) return;

    if (dados.length === 0) {

        container.innerHTML =
            "<p style='color:#777'>Nenhum HA registado no clã.</p>";

        return;
    }

    container.innerHTML = dados.map(d => `

        <div class="ha-membro-box">

            <b>${d.pokemon_name}</b>

            <span class="forma">
                ${d.form || 'Normal'}
            </span>

            <span class="ha-nome">
                HA: ${d.ha_name}
            </span>

            <footer>
                <span>Dono:</span>
                <strong>${d.username}</strong>
            </footer>

            ${
                isAdminAtual
                ?
                `<button
                    class="btn delete-btn"
                    onclick="window.excluirHA('${d.id}')">
                    EXCLUIR HA
                </button>`
                :
                ''
            }

        </div>

    `).join('');
}

window.excluirHA = async (id) => {

    if (!isAdminAtual)
        return alert(
            "Apenas o Admin pode excluir HAs."
        );

    if (!confirm(
        "Excluir este HA? Esta ação não pode ser desfeita."
    ))
        return;

    try {

        await deleteDoc(
            doc(db, "user_has", id)
        );

        await carregarHAsMembros();

    } catch (e) {

        console.error(
            "Erro ao excluir HA:",
            e
        );

        alert(
            "Erro ao excluir HA. Verifique as regras do Firestore."
        );
    }
};

window.filtrarHAsMembros = (q) => {

    const query = q.toLowerCase();

    const filtrado =
        dadosHAsMembros.filter(d =>

            (d.pokemon_name?.toLowerCase().includes(query)) ||

            (d.ha_name?.toLowerCase().includes(query)) ||

            (d.username?.toLowerCase().includes(query))

        );

    renderizarHAsMembros(filtrado);
};

function criarPainelAdmin() {

    if (
        document.getElementById('painelAdminHA')
    )
        return;

    const sec =
        document.getElementById('area-membros-clã');

    if (!sec) return;

    const div =
        document.createElement('div');

    div.id = 'painelAdminHA';

    div.style.cssText =
        "margin-bottom:20px; padding:15px; border:1px solid var(--red); background:#140c0e; display:flex; gap:10px; flex-wrap:wrap; align-items:center;";

    div.innerHTML = `

        <input
            id='novoPoke'
            placeholder='Pokémon'
            style='background:#0b0b0d;color:#eee;border:1px solid var(--line);padding:8px;'
        >

        <input
            id='novoForm'
            placeholder='Forma (ex: Alola)'
            style='background:#0b0b0d;color:#eee;border:1px solid var(--line);padding:8px;'
        >

        <input
            id='novoHa'
            placeholder='Nome da HA'
            style='background:#0b0b0d;color:#eee;border:1px solid var(--line);padding:8px;'
        >

        <input
            id='novoDono'
            placeholder='Membro Dono'
            style='background:#0b0b0d;color:#eee;border:1px solid var(--line);padding:8px;'
        >

        <button
            class='btn red'
            onclick='window.adicionarHA()'>
            + ADICIONAR HA
        </button>

    `;

    sec.insertBefore(
        div,
        sec.querySelector('.has') ||
        sec.firstChild
    );
}

function removerPainelAdmin() {

    document
        .getElementById('painelAdminHA')
        ?.remove();
}

window.adicionarHA = async () => {

    const pokemon_name =
        document.getElementById('novoPoke').value.trim();

    const form =
        document.getElementById('novoForm').value.trim();

    const ha_name =
        document.getElementById('novoHa').value.trim();

    const username =
        document.getElementById('novoDono').value.trim();

    if (!pokemon_name || !ha_name || !username) {

        alert(
            "Preencha pelo menos o Pokémon, a HA e o Membro dono!"
        );

        return;
    }

    try {

        await addDoc(
            collection(db, "user_has"),
            {
                pokemon_name,
                form,
                ha_name,
                username,
                createdAt: new Date().toISOString()
            }
        );

        alert(
            "HA adicionado com sucesso!"
        );

        document.getElementById('novoPoke').value = '';
        document.getElementById('novoForm').value = '';
        document.getElementById('novoHa').value = '';
        document.getElementById('novoDono').value = '';

        await carregarHAsMembros();

    } catch (e) {

        console.error(
            "Erro ao adicionar HA:",
            e
        );

        alert(
            "Erro ao adicionar. Verifique as permissões/regras do Firestore."
        );
    }
};


// =====================================================
// PONTUAÇÃO
// SOMENTE O ADMIN PODE ALTERAR
// + = 1 PONTO
// − = 1 PONTO
// MÍNIMO = 0
// =====================================================

window.adicionarPonto = async (id) => {

    if (!isAdminAtual) {

        alert(
            'Apenas o Admin pode adicionar pontos.'
        );

        return;
    }

    try {

        const ref =
            doc(db, 'membros', id);

        const snap =
            await getDoc(ref);

        if (!snap.exists()) {

            alert(
                'Membro não encontrado.'
            );

            return;
        }

        const atual =
            Math.max(
                0,
                Number(snap.data().pontos) || 0
            );

        await updateDoc(
            ref,
            {
                pontos: atual + 1
            }
        );

        await carregarMembrosAdmin();
        await carregarMembrosPublicos();

    } catch (e) {

        console.error(e);

        alert(
            'Erro ao adicionar ponto.'
        );
    }
};

window.removerPontos = async (id) => {

    if (!isAdminAtual) {

        alert(
            'Apenas o Admin pode remover pontos.'
        );

        return;
    }

    try {

        const ref =
            doc(db, 'membros', id);

        const snap =
            await getDoc(ref);

        if (!snap.exists()) {

            alert(
                'Membro não encontrado.'
            );

            return;
        }

        const atual =
            Math.max(
                0,
                Number(snap.data().pontos) || 0
            );

        const novoTotal =
            Math.max(
                0,
                atual - 1
            );

        await updateDoc(
            ref,
            {
                pontos: novoTotal
            }
        );

        await carregarMembrosAdmin();
        await carregarMembrosPublicos();

    } catch (e) {

        console.error(e);

        alert(
            'Erro ao remover ponto.'
        );
    }
};


// =====================================================
// GESTÃO DE MEMBROS
// =====================================================

async function carregarMembrosAdmin() {

    const lista =
        document.getElementById(
            'lista-membros-admin'
        );

    if (!lista || !isAdminAtual)
        return;

    try {

        const snap =
            await getDocs(
                collection(db, 'membros')
            );

        const membros = [];

        snap.forEach(d =>

            membros.push({
                id: d.id,
                ...d.data()
            })

        );

        membros.sort(
            (a, b) =>
                (
                    a.gameName ||
                    a.username ||
                    ''
                ).localeCompare(
                    b.gameName ||
                    b.username ||
                    ''
                )
        );

        membersRender(membros);

        if (!membros.length) {

            lista.innerHTML =
                "<p style='color:#777'>Nenhum membro cadastrado.</p>";

            return;
        }

        lista.innerHTML =
            membros.map(m => `

                <div class="admin-membro">

                    <div>

                        <b>
                            ${escapeHtml(
                                m.gameName ||
                                m.username ||
                                'Sem nome'
                            )}
                        </b>

                        <span>
                            Discord:
                            ${escapeHtml(
                                m.discord ||
                                'Não informado'
                            )}
                        </span>

                    </div>

                    <button
                        class="btn"
                        onclick="window.removerMembro('${m.id}')">

                        REMOVER

                    </button>

                </div>

            `).join('');

    } catch (e) {

        console.error(e);

        lista.innerHTML =
            "<p style='color:#d94a55'>Erro ao carregar membros. Verifique as regras do Firestore.</p>";
    }
}

function escapeHtml(value) {

    return String(value).replace(
        /[&<>'"]/g,
        c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[c])
    );
}

function criarPainelGerenciarMembros() {

    if (
        document.getElementById(
            'painelGerenciarMembros'
        )
    )
        return;

    const sec =
        document.getElementById(
            'area-gerenciar-membros'
        );

    if (!sec || !isAdminAtual)
        return;

    const div =
        document.createElement('div');

    div.id =
        'painelGerenciarMembros';

    div.innerHTML = `

        <div class="member-form">

            <div class="ey">
                NOVO MEMBRO
            </div>

            <h3>
                Adicionar membro
            </h3>

            <div class="member-form-grid">

                <input
                    id="novoMembroDiscord"
                    placeholder="Discord"
                >

                <input
                    id="novoMembroGame"
                    placeholder="Nome in game"
                >

                <button
                    class="btn red"
                    onclick="window.adicionarMembro()">

                    + ADICIONAR MEMBRO

                </button>

            </div>

            <p class="admin-nota">

                Cadastre somente
                <b>Discord</b>
                e
                <b>Nome in game</b>.
                O login por e-mail e senha é separado.

            </p>

        </div>

        <div
            class="member-list"
            id="lista-membros-admin">
        </div>

    `;

    sec.appendChild(div);
}

function removerPainelGerenciarMembros() {

    document
        .getElementById(
            'painelGerenciarMembros'
        )
        ?.remove();
}

window.adicionarMembro = async () => {

    if (!isAdminAtual)

        return alert(
            'Apenas o Admin pode adicionar membros.'
        );

    const discord =
        document
            .getElementById(
                'novoMembroDiscord'
            )
            ?.value.trim();

    const gameName =
        document
            .getElementById(
                'novoMembroGame'
            )
            ?.value.trim();

    if (!discord || !gameName) {

        alert(
            'Preencha o Discord e o nome in game.'
        );

        return;
    }

    try {

        await addDoc(
            collection(db, 'membros'),
            {
                discord,
                gameName,
                username: gameName,
                ativo: true,
                pontos: 0,
                createdAt:
                    new Date().toISOString()
            }
        );

        alert(
            'Membro adicionado com sucesso!'
        );

        document
            .getElementById(
                'novoMembroDiscord'
            ).value = '';

        document
            .getElementById(
                'novoMembroGame'
            ).value = '';

        await carregarMembrosAdmin();

    } catch (e) {

        console.error(e);

        alert(
            'Erro ao adicionar membro. Verifique as regras do Firestore.'
        );
    }
};

window.removerMembro = async (uid) => {

    if (!isAdminAtual)

        return alert(
            'Apenas o Admin pode remover membros.'
        );

    if (!confirm(
        'Remover este membro do portal? A conta de login continuará existindo, mas perderá o acesso à área de membros.'
    ))
        return;

    try {

        await deleteDoc(
            doc(db, 'membros', uid)
        );

        alert(
            'Membro removido do portal.'
        );

        await carregarMembrosAdmin();

        await carregarMembrosPublicos();

    } catch (e) {

        console.error(e);

        alert(
            'Erro ao remover membro. Verifique as regras do Firestore.'
        );
    }
};