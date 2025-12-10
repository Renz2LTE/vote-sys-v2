import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, deleteDoc, writeBatch, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js"; 

// --- 1. SECURITY & INIT ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists() && userSnap.data().role === 'admin') {
                document.getElementById('adminName').textContent = userSnap.data().first_name;
                initAdminFeatures();
            } else {
                alert("Access Denied: Admins Only");
                window.location.href = "index.html"; 
            }
        } catch(e) { console.error(e); }
    } else { window.location.href = "index.html"; }
});

function initAdminFeatures() {
    setupNavigation();
    setupElectionControls();
    loadApplications();
    setupBroadcast();
    setupAdminOrgs(); // New: Admin manages orgs
    
    // Logout
    document.getElementById('adminLogout').addEventListener('click', () => {
        if(confirm("Log out?")) signOut(auth).then(() => window.location.href = "index.html");
    });
}

// --- 2. NAVIGATION ---
function setupNavigation() {
    const navs = ['overview', 'applications', 'users', 'reports', 'settings', 'orgs'];
    navs.forEach(id => {
        const link = document.getElementById(`nav-${id}`);
        const view = document.getElementById(`view-${id}`);
        if(link && view) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navs.forEach(n => {
                    document.getElementById(`view-${n}`)?.classList.add('hidden');
                    document.getElementById(`nav-${n}`)?.classList.remove('active');
                });
                view.classList.remove('hidden');
                link.classList.add('active');
                
                // Refresh data on click
                if(id === 'users') loadUsers();
                if(id === 'applications') loadApplications();
                if(id === 'orgs') loadAdminOrgs();
                if(id === 'reports') loadAudit();
            });
        }
    });
}

// --- 3. MANAGE ORGANIZATIONS (Admin Only) ---
async function loadAdminOrgs() {
    const list = document.getElementById('adminOrgList');
    if(!list) return;
    list.innerHTML = "Loading...";
    
    const snap = await getDocs(collection(db, "organizations"));
    list.innerHTML = "";
    
    snap.forEach(d => {
        const div = document.createElement('div');
        div.className = "timeline-admin-item"; // Reuse existing style
        div.style.display = "flex"; 
        div.style.justifyContent = "space-between";
        div.innerHTML = `<span>${d.data().name}</span> <button onclick="window.delOrg('${d.id}')" style="color:red; border:none; background:none;">Delete</button>`;
        list.appendChild(div);
    });
}

// Add Org
const createOrgForm = document.getElementById('createOrgForm');
if(createOrgForm) {
    createOrgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newOrgName').value;
        await addDoc(collection(db, "organizations"), { name, mission:"", vision:"" });
        alert("Organization Created");
        createOrgForm.reset();
        loadAdminOrgs();
    });
}

window.delOrg = async (id) => {
    if(confirm("Delete this organization?")) {
        await deleteDoc(doc(db, "organizations", id));
        loadAdminOrgs();
    }
};

// --- 4. MANAGE USERS ---
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if(!tbody) return;
    tbody.innerHTML = "<tr><td>Loading...</td></tr>";
    
    const snap = await getDocs(collection(db, "users"));
    tbody.innerHTML = "";
    
    snap.forEach(d => {
        const u = d.data();
        const row = `<tr>
            <td style="padding:10px;">${u.first_name} ${u.last_name}</td>
            <td>${u.student_id || '-'}</td>
            <td>${u.strand || '-'}</td>
            <td>${u.hasVoted ? '<span style="color:green">Voted</span>' : 'Pending'}</td>
            <td><button style="font-size:12px;">Edit</button></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// --- 5. APPLICATIONS ---
async function loadApplications() {
    const tbody = document.getElementById('applicationsTableBody');
    if(!tbody) return;
    tbody.innerHTML = "<tr><td>Loading...</td></tr>";
    
    const snap = await getDocs(collection(db, "applications"));
    tbody.innerHTML = "";
    
    if(snap.empty) tbody.innerHTML = "<tr><td colspan='6' style='text-align:center'>No pending applications</td></tr>";

    snap.forEach(d => {
        const a = d.data();
        if(a.status !== 'Pending') return; // Show only pending
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:10px;">${a.applicantName}</td>
            <td>${a.position}</td>
            <td>${a.organizationId}</td> <!-- In real app, fetch org name -->
            <td>${new Date(a.appliedAt).toLocaleDateString()}</td>
            <td>${a.status}</td>
            <td>
                <button class="btn-app" onclick="window.processApp('${d.id}', true)">Approve</button>
                <button class="btn-app" onclick="window.processApp('${d.id}', false)" style="color:red">Decline</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.processApp = async (id, approve) => {
    if(!confirm(approve ? "Approve candidate?" : "Decline application?")) return;
    
    if(approve) {
        const appSnap = await getDoc(doc(db, "applications", id));
        const data = appSnap.data();
        await addDoc(collection(db, "candidates"), {
            name: data.applicantName, position: data.position, party: data.organizationId,
            userId: data.uid, voteCount: 0, photoUrl: ""
        });
    }
    
    await updateDoc(doc(db, "applications", id), { status: approve ? 'Approved' : 'Declined' });
    loadApplications();
};

// --- 6. ELECTION CONTROLS & RESET ---
function setupElectionControls() {
    // Toggle Registration
    const toggle = document.getElementById('toggleRegistration');
    const msg = document.getElementById('controlStatusMsg');
    
    // Load initial
    getDoc(doc(db, "settings", "election_controls")).then(snap => {
        if(snap.exists()) toggle.checked = snap.data().isRegistrationOpen;
        msg.textContent = toggle.checked ? "Status: Open" : "Status: Closed";
    });

    toggle.addEventListener('change', async () => {
        await setDoc(doc(db, "settings", "election_controls"), { isRegistrationOpen: toggle.checked });
        msg.textContent = toggle.checked ? "Status: Open" : "Status: Closed";
    });

    // Reset Database (Danger Zone)
    const resetBtn = document.getElementById('btnResetElection');
    if(resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const code = prompt("Type 'DELETE' to confirm wiping all election data:");
            if(code !== 'DELETE') return;
            
            const batch = writeBatch(db);
            // Example: delete all candidates
            const cands = await getDocs(collection(db, "candidates"));
            cands.forEach(c => batch.delete(c.ref));
            
            // Delete votes/reset users
            const users = await getDocs(collection(db, "users"));
            users.forEach(u => batch.update(u.ref, { hasVoted: false }));
            
            // Delete applications
            const apps = await getDocs(collection(db, "applications"));
            apps.forEach(a => batch.delete(a.ref));

            await batch.commit();
            alert("Election Reset Complete.");
            location.reload();
        });
    }
}

// --- 7. BROADCAST ---
function setupBroadcast() {
    const form = document.getElementById('broadcastForm');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('broadcastTitle').value;
            const msg = document.getElementById('broadcastMsg').value;
            await addDoc(collection(db, "notifications"), {
                title, message: msg, type: 'global', timestamp: new Date().toISOString(), readBy: []
            });
            alert("Sent!");
            form.reset();
        });
    }
}

async function loadAudit() {
    // Simple load of audit logic
    const tbody = document.getElementById('auditTableBody');
    if(!tbody) return;
    const q = query(collection(db, "users"), orderBy("first_name")); // simple query
    const snap = await getDocs(q);
    tbody.innerHTML = "";
    snap.forEach(d => {
        const u = d.data();
        if(u.hasVoted) {
            tbody.innerHTML += `<tr><td style="padding:10px;">${u.first_name}</td><td>${u.student_id}</td><td>Verified Vote</td></tr>`;
        }
    });
}