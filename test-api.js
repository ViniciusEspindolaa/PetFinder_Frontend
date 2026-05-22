// Test if API is reachable
const apiUrl = 'http://localhost:3001/api/publicacoes'

console.log(`Testing ${apiUrl}...`)

fetch(apiUrl)
  .then(res => {
    console.log(`Status: ${res.status}`)
    return res.json()
  })
  .then(data => {
    console.log('Data:', data)
    console.log('✅ Backend is working!')
  })
  .catch(err => {
    console.error('❌ Error:', err.message)
    console.error('Details:', err)
  })
