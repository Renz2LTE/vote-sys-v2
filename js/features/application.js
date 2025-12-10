/* js/features/application.js */
import { db, auth } from "../firebase-config.js";
import { doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function initApplicationFeature() {
    
    // 1. CHECK IF REGISTRATION IS OPEN
    try {
        const settingsRef = doc(db, "settings", "election_controls");
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists() || !settingsSnap.data().isRegistrationOpen) {
            console.log("Candidacy Registration is currently CLOSED.");
            return; 
        }

        // 2. IF OPEN, SHOW THE TAB
        const navItem = document.getElementById('nav-item-application');
        if(navItem) navItem.classList.remove('hidden');

        // 3. LOAD ORGANIZATIONS
        await loadOrganizations();

        // 4. SETUP EVENT LISTENERS
        const form = document.getElementById('candidacyForm');
        // Remove old listeners cloning trick
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleApplicationSubmit);

    } catch (error) {
        console.error("Error checking registration status:", error);
    }
}

async function loadOrganizations() {
    const orgSelect = document.getElementById('apply_org');
    if(!orgSelect) return;
    
    orgSelect.innerHTML = `
        <option value="" disabled selected>Select Organization</option>
        <option value="Independent">Independent</option>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "organizations"));
        
        querySnapshot.forEach((doc) => {
            const org = doc.data();
            const option = document.createElement("option");
            option.value = doc.id; 
            option.textContent = org.name;
            orgSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading organizations:", error);
    }
}

async function handleApplicationSubmit(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("You are not logged in!");

    const position = document.getElementById('apply_position').value;
    const orgId = document.getElementById('apply_org').value;

    if (!position || !orgId) return alert("Please fill all fields.");

    try {
        // Save Application
        await setDoc(doc(db, "applications", user.uid), {
            uid: user.uid,
            applicantName: document.getElementById('topName').innerText || "Unknown", 
            position: position,
            organizationId: orgId, // Now just the ID selected from dropdown
            status: "Pending", 
            appliedAt: new Date().toISOString()
        });

        alert("Application Submitted! Please wait for admin approval.");
        document.getElementById('candidacyForm').reset();

    } catch (error) {
        console.error("Error submitting application:", error);
        alert("Submission failed. Check console for details.");
    }
}