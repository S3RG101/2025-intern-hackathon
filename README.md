# Welcome to Pomotato!🥔⏰🧠📖
![Untitled design (4) (1)](https://github.com/user-attachments/assets/b7d9f590-ad81-4550-8974-f96d029e87ac)


Pomotato is an adorable, AI-powered potato-themed productivity app that reimagines the Pomodoro technique into a dynamic, distraction-free learning experience. It combines a playful interface with gamified accountability, gentle nudges, and cutting-edge AI to help students stay focused, motivated, and focused on their goals.

## Features

- **Don't get distracted**: Pomotato employs deep learning models for real-time object recognition and face detection. Whether you're chatting, using your phone, or joined by a pet, our Distraction Detector triggers an animated angry potato, sound effects and notifications, to remind you to get back on track!
- **Study Buddy AI**: Define learning objectives and receive personalized self-assessments after each sessions, enhance comprehension by generating diagrams, summaries, and explanations directly from user notes. Powered by Chat GPT 4.1.
- **Vibe to music**: Pomotato-approved Spotify beats optimize focus during study sessions and allow you to vibe during well-earned breaks.

## How to set up Study Budy AI Chat Bot
To use the Study Buddy AI agent locally, you will need to create a `.env` with these variables:
```
REACT_APP_AZURE_OPENAI_API_KEY = '<YOURKEYHERE>'
REACT_APP_AZURE_OPENAI_ENDPOINT = 'hackathon2025podomoro'
REACT_APP_AZURE_OPENAI_DEPLOYMENT = 'gpt-4.1'
REACT_APP_AZURE_OPENAI_DEPLOYMENT_EMBEDDING = 'text-embedding-3-small'
```
Make sure to edit `<YOURKEYHERE>` to an active Azure OpenAI API key. The chat panel expands when the user clicks the "StudyBuddy AI" button - the sidebar appears over the main content. The ChatGPT instance was set up in Azure.

## Images!
![Screenshot 2025-06-26 222702](https://github.com/user-attachments/assets/75cf1dd7-1170-464b-839e-245194f8efd3)
![Screenshot 2025-06-26 223853](https://github.com/user-attachments/assets/c9b3167b-60b1-4730-bec7-5f7b259061ca)
<img width="1011" alt="image" src="https://github.com/user-attachments/assets/44849bdf-7d86-4661-be72-cac068d7387e" />
<img width="1470" alt="image" src="https://github.com/user-attachments/assets/abbf0658-6d9b-476f-97d7-d06be3997e77" />


# General React App information
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
