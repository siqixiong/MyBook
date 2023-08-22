# Mybook

## instructions

1. install required packages using ```yarn install```
2. run with ```yarn start```
3. default address: http://localhost:3000/

## functionalities

1. The user does not need to sign in to see the dashboard of top 100 trending posts (or less if not enough data), sorted by how many likes the posts received, but log-in needed to see the detailed content and comments of each post (Lazy Signup)
2. After the user signed in, the user can like / save posts. Saved posts would shown in a tab called "Saved".
3. The user can see the detail of the post, and can add tags to other author's posts.
4. The search query in natural language would be processed after eliminating uncommon words and extract only important words. e.g. Tips for before the interview will only search for "tips", "interview"
6. The search results are sorted by the number of likes and saves received by the posts, if there is a tie, posts with more matched words with the query will be prioritized.# MyBook
