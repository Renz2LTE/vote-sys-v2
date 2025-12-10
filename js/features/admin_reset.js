/* js/features/admin_reset.js */
import { db } from "../firebase-config.js";
import { 
    collection, getDocs, writeBatch 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export function initResetFeature() {
    const btn = document.getElementById('btnResetElection');
    if(btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', handleReset);
    }
}

async function handleReset() {
    // 1. Double Security Check
    const confirmation = prompt(
        "⚠️ DANGER ZONE ⚠️\n\nThis will permanently delete:\n- All Candidates\n- All Votes\n- All Applications\n- All Timeline Events\n\nUser accounts will remain, but 'Has Voted' status will be reset.\n\nType 'DELETE' to confirm:"
    );

    if (confirmation !== 'DELETE') {
        return alert("Reset cancelled. Code did not match.");
    }

    const btn = document.getElementById('btnResetElection');
    btn.disabled = true;
    btn.textContent = "Wiping Data...";
    btn.style.background = "#555";

    try {
        // 2. Perform Deletions
        await deleteCollection("candidates");
        await deleteCollection("applications");
        await deleteCollection("timeline");
        await deleteCollection("notifications");
        await deleteCollection("organizations"); // Optional: Reset Orgs too

        // 3. Reset User Voting Status
        await resetUserStatus();

        alert("✅ Election System has been reset successfully.");
        location.reload();

    } catch (error) {
        console.error("Reset Failed:", error);
        alert("Error during reset. Check console.");
        btn.disabled = false;
        btn.textContent = "Reset Election Database";
        btn.style.background = "#d32f2f";
    }
}

// Helper: Delete all docs in a collection
async function deleteCollection(colName) {
    const q = collection(db, colName);
    const snapshot = await getDocs(q);
    
    // Firestore batches allow 500 ops. For school projects this is fine.
    // For production, you'd loop in chunks of 500.
    const batch = writeBatch(db);
    
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted collection: ${colName}`);
}

// Helper: Reset 'hasVoted' to false for all users
async function resetUserStatus() {
    const q = collection(db, "users");
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    
    snapshot.forEach(doc => {
        batch.update(doc.ref, { hasVoted: false });
    });

    await batch.commit();
    console.log("Users reset.");
}