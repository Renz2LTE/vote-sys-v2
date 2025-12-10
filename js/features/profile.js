/* js/features/profile.js */
import { db, auth, storage } from "../firebase-config.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

export function initProfileFeature() {
    const btnEdit = document.getElementById('btnEditProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    
    if(!btnEdit || !btnSave) return;

    // Reset Listeners
    const newEdit = btnEdit.cloneNode(true);
    const newSave = btnSave.cloneNode(true);
    btnEdit.parentNode.replaceChild(newEdit, btnEdit);
    btnSave.parentNode.replaceChild(newSave, btnSave);

    newEdit.addEventListener('click', enableEditMode);
    newSave.addEventListener('click', saveProfileChanges);
}

function enableEditMode() {
    const inputs = document.querySelectorAll('.profile-input');
    const btnEdit = document.getElementById('btnEditProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    const imgGroup = document.getElementById('imgUploadGroup');

    // Make inputs editable
    const editableIds = ['p_phone', 'p_email', 'p_address', 'p_birthday', 'p_image_upload'];
    inputs.forEach(input => {
        if(editableIds.includes(input.id)) {
            input.disabled = false;
            input.style.border = "1px solid var(--primary-blue)";
            input.style.backgroundColor = "#fff";
        }
    });

    if(imgGroup) imgGroup.classList.remove('hidden');

    btnEdit.classList.add('hidden');
    btnSave.classList.remove('hidden');
}

async function saveProfileChanges() {
    const user = auth.currentUser;
    if(!user) return;

    const btnEdit = document.getElementById('btnEditProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    const inputs = document.querySelectorAll('.profile-input');
    const fileInput = document.getElementById('p_image_upload');
    const imgGroup = document.getElementById('imgUploadGroup');

    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    btnSave.disabled = true;

    try {
        let updates = {
            phone: document.getElementById('p_phone').value,
            email: document.getElementById('p_email').value,
            address: document.getElementById('p_address').value,
            birthday: document.getElementById('p_birthday').value
        };

        // IMAGE UPLOAD LOGIC
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            // Unique path per user
            const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
            
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            updates.photoUrl = downloadURL;
            
            // Update UI immediately
            const avatarElements = [
                document.getElementById('topAvatar'), 
                document.getElementById('settingsProfileImg'),
                document.getElementById('sidebarAvatarImg')
            ];
            avatarElements.forEach(el => { if(el) el.src = downloadURL; });
            
            const sideIcon = document.getElementById('sidebarAvatarIcon');
            const sideImg = document.getElementById('sidebarAvatarImg');
            if(sideIcon && sideImg) {
                sideIcon.style.display = 'none';
                sideImg.style.display = 'block';
            }
        }

        await updateDoc(doc(db, "users", user.uid), updates);
        
        alert("Profile updated successfully!");

        // Lock UI
        inputs.forEach(input => {
            input.disabled = true;
            input.style.border = "1px solid #e0e0e0";
            input.style.backgroundColor = "#fdfdfd";
        });
        if(imgGroup) imgGroup.classList.add('hidden');

        btnSave.classList.add('hidden');
        btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Save';
        btnSave.disabled = false;
        btnEdit.classList.remove('hidden');

    } catch (error) {
        console.error("Profile update error:", error);
        alert("Failed to update profile. Check console.");
        btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Save';
        btnSave.disabled = false;
    }
}