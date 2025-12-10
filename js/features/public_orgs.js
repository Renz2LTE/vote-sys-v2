/* js/features/public_orgs.js */
import { db } from "../firebase-config.js";
import { 
    collection, getDocs, query, where, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function initPublicOrgsFeature() {
    const container = document.getElementById('publicOrgsGrid');
    if (!container) return;

    container.innerHTML = `<p style="color:#888; text-align:center; grid-column: 1/-1;">Loading organizations...</p>`;

    try {
        const q = collection(db, "organizations");
        const snapshot = await getDocs(q);

        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `<p style="color:#888; text-align:center; grid-column: 1/-1;">No organizations registered.</p>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const org = docSnap.data();
            const card = document.createElement('div');
            card.className = "card";
            card.style.textAlign = "center";
            
            const shortMission = org.mission ? org.mission.substring(0, 80) + "..." : "No details provided.";
            const banner = org.bannerUrl ? `<img src="${org.bannerUrl}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:10px;">` : `<div style="height:100px; background:#eef2ff; border-radius:8px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; color:#ccc;"><i class="fa-solid fa-image"></i></div>`;

            card.innerHTML = `
                ${banner}
                <h3 style="color: var(--dark-blue); margin-bottom: 10px;">${org.name}</h3>
                <p style="color: #666; font-size: 13px; margin-bottom: 20px; min-height: 40px;">${shortMission}</p>
                <button class="btn-vote-now btn-view-org" data-id="${docSnap.id}" style="width: 100%; border: none; background: var(--bg-light); color: var(--text-dark);">
                    View Details
                </button>
            `;
            container.appendChild(card);
        });

        // Event Delegation for View Details
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-view-org')) {
                openOrgModal(e.target.dataset.id);
            }
        });

    } catch (e) {
        console.error("Error loading orgs:", e);
        container.innerHTML = `<p style="color:red; text-align:center;">Error loading data.</p>`;
    }
}

async function openOrgModal(orgId) {
    const modal = document.getElementById('publicOrgModal');
    const content = document.getElementById('publicOrgModalContent');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    content.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading details...</div>`;

    try {
        const orgSnap = await getDoc(doc(db, "organizations", orgId));
        if(!orgSnap.exists()) return;
        const org = orgSnap.data();

        const qMembers = query(collection(db, "candidates"), where("party", "==", orgId));
        const memSnap = await getDocs(qMembers);

        let membersHtml = '';
        if(memSnap.empty) {
            membersHtml = '<p style="color:#888; font-style:italic;">No official candidates yet.</p>';
        } else {
            membersHtml = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
            memSnap.forEach(m => {
                const mem = m.data();
                const img = mem.photoUrl || "https://img.freepik.com/free-icon/user_318-159711.jpg";
                membersHtml += `
                    <div style="background: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #eee; display:flex; gap:10px; align-items:center;">
                        <img src="${img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                        <div>
                            <strong style="color: var(--primary-blue); display:block; font-size:12px;">${mem.position}</strong>
                            <span style="font-weight: 600; color: #333;">${mem.name}</span>
                        </div>
                    </div>
                `;
            });
            membersHtml += '</div>';
        }

        const bannerImg = org.bannerUrl ? `<img src="${org.bannerUrl}" style="width:100%; height:200px; object-fit:cover;">` : '';

        content.innerHTML = `
            ${bannerImg}
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: var(--dark-blue); font-size: 28px; margin-bottom: 5px;">${org.name}</h2>
                    <span style="background: #eef2ff; color: var(--primary-blue); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Official Organization</span>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Mission & Vision</h4>
                    <p style="font-size: 14px; color: #555; margin-bottom: 10px;"><strong>Mission:</strong> ${org.mission || "N/A"}</p>
                    <p style="font-size: 14px; color: #555;"><strong>Vision:</strong> ${org.vision || "N/A"}</p>
                </div>

                <div>
                    <h4 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Our Candidates</h4>
                    ${membersHtml}
                </div>
            </div>
        `;

    } catch (e) {
        console.error(e);
        content.innerHTML = `<p style="color:red; text-align:center;">Failed to load details.</p>`;
    }
}

const closeBtn = document.getElementById('closePublicOrgModal');
if(closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('publicOrgModal').classList.remove('active');
        document.getElementById('publicOrgModal').classList.add('hidden');
    });
}