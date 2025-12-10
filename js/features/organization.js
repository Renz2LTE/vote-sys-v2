import { db, auth, storage } from "../firebase-config.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

export async function initOrganizationFeature() {
    const user = auth.currentUser;
    if(!user) return;

    // Check if user is a CANDIDATE and is PRESIDENT
    const q = query(collection(db, "candidates"), where("userId", "==", user.uid));
    const snap = await getDocs(q);
    
    if(!snap.empty) {
        const data = snap.docs[0].data();
        if(data.position === 'President') {
            // Show Manage Tab
            document.getElementById('nav-item-org').classList.remove('hidden');
            setupOrgManager(data.party); // party ID
        }
    }
}

async function setupOrgManager(orgId) {
    // Load Banner & Details
    const orgDoc = await getDoc(doc(db, "organizations", orgId));
    if(orgDoc.exists()) {
        const d = orgDoc.data();
        document.getElementById('orgNameDisplay').textContent = d.name;
        if(d.bannerUrl) document.getElementById('orgBannerPreview').src = d.bannerUrl;
        
        // Setup Save
        document.getElementById('btnEditOrg').classList.remove('hidden');
        document.getElementById('editOrgForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            // Handle upload similar to profile
            // ... (Banner upload logic) ...
            alert("Organization Updated");
        });
    }
}