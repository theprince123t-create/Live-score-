fetch("./score.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("score").innerText =
      data.match + " - " + data.score;
  })
  .catch(err => {
    document.getElementById("score").innerText = "Error loading score";
  });
