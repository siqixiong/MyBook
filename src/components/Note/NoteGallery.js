import React, { useState, useEffect } from 'react';
import styles from "./NoteGallery.module.css";
import { connect } from 'react-redux';
import { Menu } from 'semantic-ui-react';
import NotesDisplay from './NotesDisplay';
import { db } from '../../firebase';
import _ from 'lodash';

const NoteGallery = ({ authUser }) => {
  const [activeMenu, setActiveMenu] = useState('trending');
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    if (authUser == null) {
      const unsubscribe = db.collection('notes')
      .limit(100)
      .onSnapshot((querySnapshot) => {
        const notesData = querySnapshot.docs.map(doc => [doc.id, doc.data()]);
        notesData.sort((a, b) => {
          // return the one with more likes
          console.log(b[1].likes)
          return b[1].likes.length - a[1].likes.length;
        });
        setNotes(notesData);
      });
      return unsubscribe;
    } else if (activeMenu === 'trending') {
      const unsubscribe = db.collection('notes')
        .limit(100)
        .onSnapshot((querySnapshot) => {
          const notesData = querySnapshot.docs.map(doc => [doc.id, doc.data()]);
          notesData.sort((a, b) => {
            // return the one with more likes
            return b[1].likes.length - a[1].likes.length;
          });
          setNotes(notesData);
        });
      return unsubscribe;
    } else if (activeMenu === 'saved') {
      db.collection('users').doc(authUser.uid)
        .get()
        .then((doc) => doc.data().saved)
        .then((saved) => Promise.all(saved.map((noteId) => db.collection('notes').doc(noteId).get())))
        .then((docs) => {
          const notesData = docs.map(doc => [doc.id, doc.data()]);
          setNotes(notesData);
        })
        .catch((error) => console.error(error));
    }
  }, [activeMenu, authUser]);

  const onClickHandler = (e, { name }) => setActiveMenu(name);

  return (
    <div className={styles.container}>
    
          {authUser == null ? (
            <Menu pointing secondary className={styles.menu}>
            <Menu.Item 
            name='trending' 
            active={activeMenu === 'trending'} 
            onClick={onClickHandler} 
            style={{ marginLeft: 'auto',  marginRight: 'auto'}} 
            />
            </Menu>
            )
          : (
              <Menu pointing secondary className={styles.menu}>
              <Menu.Item 
                name='trending' 
                active={activeMenu === 'trending'} 
                onClick={onClickHandler} 
                style={{ marginLeft: 'auto' }} 
              />
              <Menu.Item 
                name='saved' 
                active={activeMenu === 'saved'} 
                onClick={onClickHandler} 
                style={{ marginRight: 'auto' }} 
              />
            </Menu>
            )
          }
      <NotesDisplay notes={notes} />
    </div>
  );
}

const mapStateToProps = (state) => ({
});

export default connect(mapStateToProps)(NoteGallery);