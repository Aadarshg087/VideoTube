// Fetching the github user details using async/await and promises
const user1 = "aadarshg087";
const user2 = "hiteshchoudhary";
const user3 = "fireship-io";

// PROMISE
/*

function fetchUserDetails(user){
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/users/${user}`;
    fetch(url)
    .then((res)=>{
        return res.json();
    })
    .then((data)=>{
        // console.log(data);
        resolve(data);
    })
    .catch((error)=>{
      reject(error);
    })
  })
}

fetchUserDetails(user1)
.then((res)=>{
  console.log("The user is fetched successfully : ", res);
  console.log(res.bio)
})
.catch((error)=>{
  console.log("Therer is some error: ", error);
})
*/
function fetchUserDetails(user) {
  const url = `https://api.github.com/users/${user}`;
  fetch(url)
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log("There is some error");
    });
}

fetchUserDetails(user1);

// fetchUserDetails(user1)
//   .then((res) => {
//     console.log("The user is fetched successfully : ", res);
//     console.log(res.bio);
//   })
//   .catch((error) => {
//     console.log("There is some error: ", error);
//   });

// USING ASYCN / AWAIT

// function fetchUserDetails(user) {
//   return new Promise((resolve, reject) => {
//     const url = `https://api.github.com/users/${user}`;
//     fetch(url)
//       .then((res) => {
//         return res.json();
//       })
//       .then((data) => {
//         // console.log(data);
//         resolve(data);
//       })
//       .catch((error) => {
//         reject(error);
//       });
//   });
// }

// async function getDetails(user) {
//   try {
//     const res = await fetchUserDetails(user);
//     console.log(res);
//     console.log("################################");
//   } catch (error) {
//     console.log("There is some error: ", error);
//   }
// }

// const arr = [user1, user2, user3];
// for (let i = 0; i < arr.length; i++) {
//   getDetails(arr[i]);
// }
