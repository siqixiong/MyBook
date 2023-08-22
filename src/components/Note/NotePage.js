import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import styles from "./NotePage.module.css";
import { withRouter } from 'react-router-dom';
import { Loader, Form, Image } from 'semantic-ui-react';
import useNoteData from './useNoteData';
import useTags from './useTags';
import Comments from './NotePageComments';
import shortid from 'shortid';
import moment from 'moment';
import firebase, { db } from '../../firebase';
import { Comment, Label, Icon } from 'semantic-ui-react';
import Carousel from 'nuka-carousel';
import { auth } from '../../firebase';
import { Button } from 'semantic-ui-react';


const NotePage = ({ history, match, authUser }) => {
  const noteId = match.params.noteid;
  const noteData = useNoteData(noteId);
  let tagsData = useTags(noteId, authUser);
  const [commentText, setCommentText] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTagValue, setCurrentTagValue] = useState('');

  useEffect(() => {
    setTags(tagsData);
  }, [tagsData]);

  const onEnterHandler = (e) => {
    if (e.key === 'Enter' && authUser !== null) {
      console.log(currentTagValue);
      if (currentTagValue.length > 0 && !tags.find(tag => tag === currentTagValue)) {
      setTags(oldTags => [currentTagValue, ...oldTags]);
      db.collection('users').doc(authUser.uid)
          .set({
            tags: {
              [`${currentTagValue}`]: firebase.firestore.FieldValue.arrayUnion(noteId)
            }
          }, {merge: true})
          .then(() => console.log('success'))
          .catch(error => console.error(error));
        
      }
      setCurrentTagValue('');
      e.preventDefault();
      
    }

  }

  const onDeleteHandler = (e, currentTag) => {
    console.log(currentTag);
    e.preventDefault();
    setTags(oldTags => oldTags.filter(oldTag => oldTag !== currentTag));
    if (authUser !== null) {
      console.log(currentTag);
      if (currentTag.length > 0) {
      db.collection('users').doc(authUser.uid)
          .set({
            tags: {
              [`${currentTag}`]: firebase.firestore.FieldValue.arrayRemove(noteId)
            }
          }, {merge: true})
          .then(() => console.log('success'))
          .catch(error => console.error(error));
        
      }
      setCurrentTagValue('');
      
    }

  }

  if (noteData === null) {
    return <Loader active/>
  }

  if (noteData === '!exists') {
    return <div>Note does not exists</div>;
  }

  if (authUser) {
  return (
    <div className={styles.container}>
      <Button className={styles.signOutButton} primary size='small' onClick={() => auth.signOut()}> Sign Out </Button>
      
      <div className={styles.contentContainer}>

      <Carousel 
        className="styles.carousel"  
        renderTopCenterControls={({ currentSlide }) => (
          <div></div>
        )}
        renderCenterLeftControls={({ previousSlide }) => (
          <Icon onClick={previousSlide} className="grey angle left big"/>
        )}
        renderCenterRightControls={({ nextSlide }) => (
          <Icon onClick={nextSlide} className="grey angle right big"/>
        )}

        heightMode="current"
       >
        {noteData.imageUrls.map((url) => {
              return (
                <Image className={styles.image} key={url} src={url} onLoad={() => {
                  window.dispatchEvent(new Event("resize"));
                }} />
              )
            })}

      </Carousel>

        <div>
          <h3>{noteData.title}</h3>
        </div>    
        <div className={styles.content}>
          {noteData.content}
        </div>



      </div>


      <div className={styles.info}>
        <div className={styles.author} onClick={() => history.push(`/${noteData.author.username}`)}  >
          <Comment.Group>
            <Comment>
              <Comment.Avatar as='a' src={noteData.author.photoURL} />
              <Comment.Content>
                <Comment.Author>{noteData.author.displayName}</Comment.Author>
                <Comment.Metadata>
                  {moment(noteData.date.toDate()).fromNow()}
                </Comment.Metadata>
              </Comment.Content>
            </Comment>
          </Comment.Group>
        </div>


        {authUser 
          ? (
            <div className={styles.commentArea}>
              
              <Form onSubmit={(e) => {
                e.preventDefault();
                setCommentText('');
                const commentData = {
                  id: shortid.generate(),
                  uid: authUser.uid,
                  avatarURL: authUser.photoURL,
                  displayName: authUser.displayName,
                  content: commentText,
                  date: firebase.firestore.Timestamp.fromDate(new Date()),
                }
                db.collection('notes').doc(noteId).update({
                  comments: firebase.firestore.FieldValue.arrayUnion(commentData)
                })
                  .then(() => console.log('add comment successfully'))
                  .catch((error) => console.error(error));
              }}>
                <Form.TextArea value={commentText} onChange={(e, { value }) => setCommentText(value)} />
                <Form.Button type='submit'>Submit</Form.Button>
              </Form>

              {authUser !== null && authUser.uid !== noteData.author.uid ? (
              <Form className={styles.addTags}> 
                <Form.Input
                    placeholder='press enter to add tags'
                    value={currentTagValue}
                    onChange={(e, { value }) => setCurrentTagValue(value)}
                    onKeyDown={onEnterHandler}
                  />
                  {
                    tags.map((tag, index) => (
                    <Label
                      key={index}
                      onClick={(e) => onDeleteHandler(e, tag)}
                      style={{cursor: 'pointer'}}
                    >
                      {tag}
                      <Icon name='delete' />
                    </Label>))
                  }
              </Form>
              ) : null}
            </div>
          )
          : null}


        <div className={styles.comments}>
        <Comments comments={noteData.comments}/>
       </div>
      </div>
    </div>
  )} 
  return (
    // This user is not signed in
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontWeight: 'bold' }}>
      Sign in to see the post.
    </div>
  );;
}

const mapStateToProps = (state) => ({
  authUser: state.auth.authUser
});

export default connect(mapStateToProps)(withRouter(NotePage));