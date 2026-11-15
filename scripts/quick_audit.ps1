$out = "C:\Users\USER\.gemini\antigravity\brain\281b4160-2fd9-493c-b617-51f93f8bbe53\screenshots"

npx playwright screenshot --channel chrome http://localhost:3000/ "$out\home.png"
npx playwright screenshot --channel chrome http://localhost:3000/courses "$out\courses.png"
npx playwright screenshot --channel chrome http://localhost:3000/login "$out\login.png"
npx playwright screenshot --channel chrome http://localhost:3000/register "$out\register.png"
npx playwright screenshot --channel chrome http://localhost:3000/about "$out\about.png"
npx playwright screenshot --channel chrome http://localhost:3000/cart "$out\cart.png"
