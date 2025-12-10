/* js/features/admin_orgs.js */
import { db, storage } from "../firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

export async function initAdminOrgs() {
    await loadOrgs();
    
    const form = document.getElementById('createOrgForm');
    if(form) {
        // Cloning hack to remove old listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleCreateOrg);
    }
}

async function loadOrgs() {
    const list = document.getElementById('adminOrgList');
    list.innerHTML = "Loading...";
    
    try {
        const snapshot = await getDocs(collection(db, "organizations"));
        list.innerHTML = "";
        
        snapshot.forEach(docSnap => {
            const org = docSnap.data();
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; padding:10px; border:1px solid #eee; margin-bottom:5px; background:white; align-items:center;";
            div.innerHTML = `
                <span>${org.name}</span>
                <button class="btn-del-org" data-id="${docSnap.id}" style="color:red;border:none;background:none;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            `;
            list.appendChild(div);
        });

        document.querySelectorAll('.btn-del-org').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteOrg(btn.dataset.id));
        });
    } catch(e) { console.error(e); list.innerHTML = "Error loading."; }
}

async function handleCreateOrg(e) {
    e.preventDefault();
    const name = document.getElementById('newOrgName').value;
    // Optional banner upload at creation can be added here, currently just name
    try {
        await addDoc(collection(db, "organizations"), { name, mission: "", vision: "" });
        alert("Organization Created!");
        document.getElementById('newOrgName').value = "";
        loadOrgs();
    } catch(e) { alert("Failed to create."); }
}

async function handleDeleteOrg(id) {
    if(!confirm("Delete this organization?")) return;
    try {
        await deleteDoc(doc(db, "organizations", id));
        loadOrgs();
    } catch(e) { alert("Failed to delete."); }
}