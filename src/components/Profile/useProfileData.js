import { useState, useEffect } from 'react';
import { db } from '../../firebase';

const useProfileData = (username) => {
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    db.collection('users').where('username', '==', username)
      .onSnapshot((querySnapshot) => {
        if (!querySnapshot.size) {
          setProfileData('!exists')
        } else if (querySnapshot.size === 1) {
          const _profileData = {
            id: querySnapshot.docs[0].id,
            data: querySnapshot.docs[0].data(),
          };
          setProfileData(_profileData);
        }
      });
  }, [username]);
  return profileData
}

export default useProfileData;