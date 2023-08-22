import React from 'react';
import styles from "./Home.module.css";
import { connect } from 'react-redux';
import { Loader } from 'semantic-ui-react';
import { AddNote, NoteGallery } from '../Note';
import { auth } from '../../firebase';
import { Button } from 'semantic-ui-react';

const Home = ({ authLoading, authUser }) => {
  if (authLoading) {
    return <Loader active />
  } else if (authUser === null) {
    return (
      <div className={styles.container}>
      <div className={styles.notesGallary}>
        <NoteGallery authUser={authUser} />
      </div>
    </div>
    )
  }
  return (
    <div className={styles.container}>
      <Button className={styles.signOutButton} primary size='small' onClick={() => auth.signOut()}> Sign Out </Button>
      <div className={styles.notesGallary}>
        <NoteGallery authUser={authUser} />
      </div>
      <div className={styles.addNote}>
        <AddNote authUser={authUser} />
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  authUser: state.auth.authUser,
  authLoading: state.auth.loading
});

export default connect(mapStateToProps)(Home);