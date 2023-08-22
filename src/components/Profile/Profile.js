import React, { useState, useEffect } from 'react';
import styles from "./Profile.module.css";
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Loader, Button, Image, Modal, List } from 'semantic-ui-react';
import useProfileData from './useProfileData';
import { NotesDisplay } from '../Note';
import { auth, db } from '../../firebase';

const useNotes = (profileData) => {
  const [notes, setNotes] = useState(null);
  useEffect(() => {
    if (profileData && profileData !== '!exists') {
      const noteIds = profileData.data.notes;
      Promise.all(noteIds.map((noteId) => db.collection('notes').doc(noteId).get()))
        .then((docs) => docs.map((doc) => [doc.id, doc.data()]))
        .then((notesData) => setNotes(notesData))
        .catch((error) => console.error(error));
    }
  }, [profileData]);
  return notes;
}

const useUserData = (authLoading, authUser) => {
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    if (authLoading || authUser === null) { 
      return;
    } else {
      db.collection('users').doc(authUser.uid)
        .onSnapshot((doc) => {
          setUserData(doc.data());
        });
    }
  }, [authLoading, authUser]);
  return userData;
}

const Profile = ({ authLoading, authUser, match, history }) => {
  const username = match.params.username;
  const _profileData = useProfileData(username);
  console.log(_profileData);
  const notes = useNotes(_profileData);
  const currentUserData = useUserData(authLoading, authUser);

  if (_profileData === null || authLoading || (authUser && !currentUserData)) {
    return <Loader active />
  }

  if (_profileData === '!exists') {
    return (
      <div className={styles.doesNotExist}>
        <p>Sorry, user {username} does not exist.</p>
      </div>
    );
  }

  const profileUid = _profileData.id;
  const profileData = _profileData.data;
  const { displayName, photoURL} = profileData;

  if (authUser && profileUid === authUser.uid) {
    console.log('this is my profile page');
    return (
      <div className={styles.profileContainer}>
        <div className={styles.userInfo}>
          <Image size='tiny' className={styles.image} key={photoURL} src={photoURL} circular={true}/>
          <div style={{ fontWeight: 'bold' }}>{ displayName }</div>
          <div className={styles.signOutContainer}>
            <Button negative onClick={() => auth.signOut()}>Sign Out</Button>
          </div>
        </div>        
        { notes ? <div className={styles.notesDisplay}><NotesDisplay notes={notes} /></div> : null }
      </div>
    );
  }
 
  if (authUser && profileUid !== authUser.uid) {
    console.log('this is someone else\'s profile page');
    return (
      <div className={styles.profileContainer}>
        <div className={styles.userInfo}>
          <Image size='tiny' className={styles.image} key={photoURL} src={photoURL} circular={true}/>
          <div>{ displayName }</div>
        </div>
        { notes ? <div className={styles.notesDisplay}><NotesDisplay notes={notes} /></div> : null }
      </div>
    );
  }

  return (
    // This user is not signed in
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontWeight: 'bold' }}>
      Sign in to see the user's profile.
    </div>
  );
}

const mapStateToProps = (state) => ({
  authUser: state.auth.authUser,
  authLoading: state.auth.authLoading
});

export default connect(mapStateToProps)(withRouter(Profile));