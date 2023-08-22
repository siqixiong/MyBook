import React, { useState, useEffect } from 'react';
import styles from './Nav.module.css';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Search } from 'semantic-ui-react';
import MenuBeforeSignIn from './MenuBeforeSignIn';
import MenuAfterSignIn from './MenuAfterSignIn';
import { db } from '../../firebase';
import _ from 'lodash';

const Nav = ({ authLoading, authUser, history, location }) => {
  const [value, setValue] = useState('');
  const [results, setResults] = useState({});
  const [allNotes, setAllNotes] = useState([]);
  const [recommendNotes, setRecommendNotes] = useState([]);
  const [tagNotes, setTagNotes] = useState([]);
  useEffect(() => {
    let notes = [];
    db.collection('notes').get().then(querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        notes.push([doc.id, doc.data()]);
      })
    });
    setAllNotes(notes);
  }, []);

  const handleSearchChange = (e, { value }) => {
    console.log(value);
    setValue(value);
    setRecommendNotes([]);
    setTagNotes([]);
    const natural = require('natural');
    const stemmer = natural.PorterStemmer;
    let queries = stemmer.tokenizeAndStem(value);
    console.log(queries);

    if (value.length < 1) return setResults([]);
    let notesFound = new Array();
    allNotes.forEach(([id, data]) => {
      let title_tokens = stemmer.tokenizeAndStem(data.title);
      let arrays = new Array();
      arrays[0] = title_tokens;
      arrays[1] = queries;
      let result = arrays.shift().reduce(function(res, v) {
        if (res.indexOf(v) === -1 && arrays.every(function(a) {
            return a.indexOf(v) !== -1;
        })) res.push(v);
        return res;
      }, []);
      if (result.length > 0) {
        notesFound.push([id, data, result.length]);
      }
    });
    // sorting
    // 1. like + save 
    // 2. only saved 2
    // 3. only liked 1
    // 4. sort by matched words in the title and query
    // when there is a tie in 1, 2, 3 scenerios
    // we would sort by matched words in the title and query
    let likedNotes = [];    
    let savedNotes = [];
    let taggedNotes = {};
    let relatedTags = [];
    if (authUser !== null) {
      db.collection('users').doc(authUser.uid).get()
      .then((doc) => doc.data())
      .then((doc) => {
        likedNotes.push(...doc.liked);
        savedNotes.push(...doc.saved);
        Object.entries(doc.tags).map(([tag, notes]) => {
          if (notes.length > 0) {
            console.log(tag);
            taggedNotes[tag] = notes;
            let tag_tokens = stemmer.tokenizeAndStem(tag);
            console.log(tag_tokens)
            let arrays = new Array();
            arrays[0] = tag_tokens;
            arrays[1] = queries;
            let result = arrays.shift().reduce(function(res, v) {
              if (res.indexOf(v) === -1 && arrays.every(function(a) {
                  return a.indexOf(v) !== -1;
              })) res.push(v);
              return res;
            }, []);
            console.log(result);
            if (result.length > 0) {
              relatedTags.push(tag);
            }
          }
        });
        console.log(likedNotes);
        notesFound.sort((a, b) => {
          let a_priority = 0;
          let b_priority = 0;
          console.log(likedNotes);
          if (savedNotes.includes(a[0])) {
            a_priority += 2;
          }
          if (likedNotes.includes(a[0])) {
            a_priority += 1;
          } 
          if (savedNotes.includes(b[0])) {
            b_priority += 2;
          }
          if (likedNotes.includes(b[0])) {
            b_priority += 1;
          } 
          if (a_priority == b_priority) {
            // return the one with more matched words in the title and query
            return b[2] - a[2];
          }
          return b_priority - a_priority;
        });
        setResults(prevResults => ({...prevResults,
          results:{
            name: "results",
            results: []
          }
        }));
        notesFound.map((note) => {
          console.log(note);
          let curr = {
            title: note[1].title,
            image: note[1].imageUrls[0],
            noteid: note[0],
            key: note[0]
          }
          setResults(prevResult => ({
            ...prevResult, 
            results: {
              ...prevResult.results,
              results: [...prevResult.results.results, curr]
            }
          }));
        })

        console.log(results);
        console.log(notesFound);
        setResults(prevResults => ({...prevResults,
          tagged:{
            name: "tagged",
            results:[]
          }
        }));
        let tagArrays = new Array();
        tagArrays[0] = relatedTags.forEach(currTag => {
          let currNotes = taggedNotes[currTag];
          console.log(currNotes);
          currNotes.forEach(note => {
            let found = false;
            notesFound.forEach(([id, data, count]) => {
              if (note === id) {
                found = true;
              }
            })
            if (!found) {
              console.log(note);
              db.collection('notes').doc(note).get()
              .then ((doc) => {
                console.log(doc.data());
                console.log(doc.id);
                let curr = {
                  title: doc.data().title,
                  image: doc.data().imageUrls[0],
                  noteid: doc.id,
                  key: doc.id
                }
                setResults(prevResult => ({
                  ...prevResult, 
                  tagged: {
                    ...prevResult.tagged,
                    results: [...prevResult.tagged.results, curr]
                  }
                }));

                setTagNotes([...tagNotes, curr]);

              });
            }
          });
        });
        // Promise.all(tagArrays).then(() => {
        //   setResults(prevResults => ({...prevResults,
        //     tagged:{
        //       name: "tagged",
        //       results: tagNotes
        //     }
        //   }))
        // });
        // recommend notes from the authors the user liked their posts before
        console.log(likedNotes)
        setResults(prevResults => ({...prevResults,
          recommendations:{
            name: "recommendations",
            results:[]
          }
        }));
        let authors = [];
        let recommended = [];
        for (let likedNote of likedNotes) {
      
          if (recommended.length > 0) {
            break;
          }
          console.log(likedNote)
          db.collection('notes').doc(likedNote).get()
          .then ((doc) => {
            if (doc.data().author.uid !== authUser.uid) {
              authors.push(doc.data().author.uid);
              // if the user liked notes from author other than him or herself
              db.collection('users').doc(doc.data().author.uid).get()
              .then((doc) => {
                console.log(doc.data().notes);
                doc.data().notes.forEach((noteId) => {
                  db.collection('notes').doc(noteId).get()
                  .then ((note) => {
                    console.log(note.data())
                    let curr = {
                      title: note.data().title,
                      image: note.data().imageUrls[0],
                      noteid: note.id,
                      key: note.id
                    }
                    setResults(prevResult => ({
                      ...prevResult, 
                      recommendations: {
                        ...prevResult.recommendations,
                        results: [curr]
                      }
                    }));
                    recommended.push(curr);
                    setRecommendNotes([curr]);
                  });
                })
               
              })
            }
          })
        };
        console.log(results);
        // setResults(prevResults => ({...prevResults,
        //   recommendations:{
        //     name: "recommendations",
        //     results: recommendNotes
        //   }
        // }));
      });
      
    } else {
      // not signed in
      notesFound.sort((a, b) => {
        // return the one with more matched words in the title and query
        return b[2] - a[2];
      });
      notesFound.map((note) => {
        console.log(note);
        let curr = {
          title: note[1].title,
          image: note[1].imageUrls[0],
          noteid: note[0],
          key: note[0]
        }
        setResults(prevResult => {
          if (!prevResult.results) {
            return ({
              results: {
                name: "results",
                results: [curr]
              }
            });
          } else {
            return ({
              ...prevResult, 
              results: {
                ...prevResult.results,
                results: [...prevResult.results.results, curr]
              }
            });
          }
        });
          
      })
    }
      
  }

  if (location.pathname === '/signin' || authLoading) {
    return null;
  }

  return (
    <div className={styles.container} onScroll={(e) => {
      console.log(e);
    }}>

      <div className={styles.logo} onClick={() => history.push('/')}>
        MyBook
      </div>

      <div className={styles.search}>
        <Search
          category
          onSearchChange={handleSearchChange}
          results={results}
          value={value}
          fullTextSearch="false"
          onResultSelect={(e, { result }) => {
            history.push(`/n/${result.noteid}`);
            setValue('');
          }}
        />
      </div>
      
      <div className={styles.menu}>
        { 
          authUser 
          ? <MenuAfterSignIn authUser={authUser} history={history} />
          : <MenuBeforeSignIn history={history} />
        }
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  authUser: state.auth.authUser,
  authLoading: state.auth.loading
});

export default connect(mapStateToProps)(withRouter(Nav));