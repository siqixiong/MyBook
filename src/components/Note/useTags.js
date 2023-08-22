import { useState, useEffect } from 'react';
import { db } from '../../firebase';

const useTags = (noteId, authUser) => {
    const [tags, setTags] = useState([]);
    useEffect(() => {
        let allTags = [];
        if (authUser !== null) {
            const unsubscribe = db.collection('users').doc(authUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    Object.entries(doc.data().tags).map(([tag, notes]) => {
                        if (notes.length > 0 && notes.includes(noteId)) {
                            allTags.push(tag); 
                        }
                    });
                    setTags(allTags);
                    console.log(allTags)
                }
            });
            return unsubscribe;
        }
    }, [noteId, authUser]);
    return tags;
}

export default useTags;