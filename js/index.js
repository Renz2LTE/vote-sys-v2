import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js"; 

// --- UI ELEMENTS ---
const modalOverlay = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModal');
const selectionBox = document.getElementById('roleSelectionBox');
const loginFormBox = document.getElementById('loginFormBox');
const registerFormBox = document.getElementById('registerFormBox');
const btnSelectStudent = document.getElementById('btnSelectStudent');
const btnSelectAdmin = document.getElementById('btnSelectAdmin');
const backToSelection = document.getElementById('backToSelection');
const showRegisterLink = document.getElementById('showRegister');
const showRegisterFromSelect = document.getElementById('showRegisterFromSelect');
const showLoginLink = document.getElementById('showLogin');

let targetPortal = 'user'; 

// --- MODAL TRIGGERS ---
document.querySelectorAll('.btn-login').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal('selection'); });
});
document.querySelectorAll('.btn-register, .btn-hero, .btn-small-outline').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal('register'); });
});

// --- PORTAL SELECTION ---
btnSelectStudent.addEventListener('click', () => {
    targetPortal = 'user';
    document.getElementById('loginTitle').textContent = "Student Sign In";
    document.querySelector('.modal-welcome-text h2').textContent = "Student Portal";
    switchView('login');
    // hcaptcha.reset() ensures a fresh check if they switch back and forth
    try { hcaptcha.reset(); } catch(e) {}
});

btnSelectAdmin.addEventListener('click', () => {
    targetPortal = 'admin';
    document.getElementById('loginTitle').textContent = "Admin Sign In";
    document.querySelector('.modal-welcome-text h2').textContent = "Admin Portal";
    switchView('login');
    try { hcaptcha.reset(); } catch(e) {}
});

backToSelection.addEventListener('click', () => switchView('selection'));

// --- VIEW UTILS ---
closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });

showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); switchView('register'); });
showRegisterFromSelect.addEventListener('click', (e) => { e.preventDefault(); switchView('register'); });
showLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchView('selection'); });

function openModal(view) {
    modalOverlay.classList.add('active');
    switchView(view);
}

function switchView(view) {
    selectionBox.classList.add('hidden');
    loginFormBox.classList.add('hidden');
    registerFormBox.classList.add('hidden');
    document.getElementById('signInMessage').innerHTML = '';
    document.getElementById('signUpMessage').innerHTML = '';

    if (view === 'selection') {
        selectionBox.classList.remove('hidden');
        document.querySelector('.modal-welcome-text h2').textContent = "Welcome!";
    } else if (view === 'login') {
        loginFormBox.classList.remove('hidden');
    } else if (view === 'register') {
        registerFormBox.classList.remove('hidden');
        document.querySelector('.modal-welcome-text h2').textContent = "Join Us!";
    }
}

function showMessage(msg, divId, color='#d32f2f') {
    const div = document.getElementById(divId);
    div.style.color = color;
    div.innerHTML = msg;
    setTimeout(() => div.innerHTML = '', 5000);
}

// --- AUTH LOGIC ---
document.getElementById('submitLogin').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login_email').value.trim();
    const pass = document.getElementById('login_password').value.trim();
    const msgDiv = 'signInMessage';

    // 1. Basic Fields Check
    if(!email || !pass) return showMessage('Please enter email and password.', msgDiv);
    
    // 2. hCAPTCHA CHECK
    // client-side validation check
    const captchaResponse = hcaptcha.getResponse();
    if(captchaResponse.length === 0) {
        return showMessage('Please complete the hCaptcha.', msgDiv);
    }

    try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const uid = cred.user.uid;
        const userDoc = await getDoc(doc(db, "users", uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const dbRole = userData.role; 

            if (targetPortal === 'admin') {
                if (dbRole !== 'admin') {
                    return showMessage('Access Denied: Not an Admin.', msgDiv);
                }
                showMessage('Admin Login Verified. Redirecting...', msgDiv, 'green');
                setTimeout(() => window.location.href = 'admin.html', 1000);
            } else {
                showMessage('Login successful! Redirecting...', msgDiv, 'green');
                setTimeout(() => window.location.href = 'user_dashboard.html', 1000);
            }
        } else {
            showMessage('User data not found.', msgDiv);
        }
    } catch (err) {
        console.error(err);
        try { hcaptcha.reset(); } catch(e) {} // Reset captcha on error
        showMessage('Incorrect credentials.', msgDiv);
    }
});

document.getElementById('submitSignUp').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup_email').value.trim();
    const pass = document.getElementById('signup_password').value.trim();
    
    if(pass.length < 6) return showMessage('Password too short', 'signUpMessage');

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const fname = document.getElementById('first_name').value;
        const lname = document.getElementById('last_name').value;
        const sid = document.getElementById('student_id').value;
        const bday = document.getElementById('birthday').value;
        const yl = document.getElementById('year_level').value;
        const strand = document.getElementById('strand').value;
        const addr = document.getElementById('address').value;
        const ph = "+63" + document.getElementById('phone_number').value;

        await setDoc(doc(db, "users", cred.user.uid), {
            first_name: fname, last_name: lname, student_id: sid, birthday: bday,
            year_level: yl, strand: strand, address: addr, phone: ph, email: email,
            role: 'user', hasVoted: false, createdAt: new Date().toISOString()
        });

        showMessage('Account created! Sign in.', 'signUpMessage', 'green');
        setTimeout(() => { switchView('selection'); }, 1500);
    } catch (err) {
        console.error(err);
        showMessage(err.message, 'signUpMessage');
    }
});