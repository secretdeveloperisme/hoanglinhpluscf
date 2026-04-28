async function updateUserProfile(userId, payload) {
  const res = await fetch(`/api/users.php?action=update&id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data;
}


export { updateUserProfile };
