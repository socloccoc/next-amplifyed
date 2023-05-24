// pages/index.js
import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify, API, Auth, withSSRContext } from 'aws-amplify';
import Head from 'next/head';
import awsExports from '../src/aws-exports';
import { createPost } from '../src/graphql/mutations';
import { listPosts } from '../src/graphql/queries';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { getRekognitionClient } from '@/helpers/rekognition';
// import styles from '../styles/Home.module.css';

Amplify.configure({ ...awsExports, ssr: true });

export async function getServerSideProps({ req }) {
  const SSR = withSSRContext({ req });
  
  try {
    const response = await SSR.API.graphql({ query: listPosts, authMode: 'API_KEY' });
    return {
      props: {
        posts: response.data.listPosts.items,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {},
    };
  }
}

async function handleCreatePost(event) {
  event.preventDefault();

  const form = new FormData(event.target);

  try {
    const { data } = await API.graphql({
      authMode: 'AMAZON_COGNITO_USER_POOLS',
      query: createPost,
      variables: {
        input: {
          title: form.get('title'),
          content: form.get('content')
        }
      }
    });

    window.location.href = `/posts/${data.createPost.id}`;
  } catch ({ errors }) {
    console.error(...errors);
    throw new Error(errors[0].message);
  }
}

export default function Home({ posts = [] }) {
  const [loading, setLoading] = React.useState(true);
  const [createLivenessApiData, setCreateLivenessApiData] = React.useState(null);

  React.useEffect(() => {
    const fetchCreateLiveness = async () => {
      const rekognition = await getRekognitionClient();
      const response = await rekognition.createFaceLivenessSession().promise();
      const mockResponse = { sessionId: response.SessionId };
      const data = mockResponse;

      setCreateLivenessApiData(data);
      setLoading(false);
    };

    fetchCreateLiveness();
  }, []);

  const handleAnalysisComplete = async () => {
    /*
     * This should be replaced with a real call to your own backend API
     */
    const response = await fetch(
      `/api/get?sessionId=${createLivenessApiData.sessionId}`
    );
    const data = await response.json();

    /*
     * Note: The isLive flag is not returned from the GetFaceLivenessSession API
     * This should be returned from your backend based on the score that you
     * get in response. Based on the return value of your API you can determine what to render next.
     * Any next steps from an authorization perspective should happen in your backend and you should not rely
     * on this value for any auth related decisions.
     */
    if (data.isLive) {
      console.log('User is live');
    } else {
      console.log('User is not live');
    }
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-2">
      <ThemeProvider>
      {loading ? (
        <Loader />
      ) : (
        <FaceLivenessDetector
          sessionId={createLivenessApiData.sessionId}
          region="us-east-2"
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </ThemeProvider>
    </div>
    // <div className="flex min-h-screen flex-col items-center justify-between p-2">

    //   <main>
    //     <p>
    //       <code>{posts.length}</code>
    //       posts
    //     </p>

    //     <div>
    //       {posts.map((post) => (
    //         <a href={`/posts/${post.id}`} key={post.id}>
    //           <h3>{post.title}</h3>
    //           <p>{post.content}</p>
    //         </a>
    //       ))}

    //       <div>
    //         <h3>New Post</h3>

    //         <Authenticator>
    //           <form onSubmit={handleCreatePost}>
    //             <fieldset>
    //               <legend>Title</legend>
    //               <input
    //                 defaultValue={`Today, ${new Date().toLocaleTimeString()}`}
    //                 name="title"
    //               />
    //             </fieldset>

    //             <fieldset>
    //               <legend>Content</legend>
    //               <textarea
    //                 defaultValue="I built an Amplify project with Next.js!"
    //                 name="content"
    //               />
    //             </fieldset>

    //             <button>Create Post</button>
    //             <button type="button" onClick={() => Auth.signOut()}>
    //               Sign out
    //             </button>
    //           </form>
    //         </Authenticator>
    //       </div>
    //     </div>
    //   </main>
    // </div>
  );
}