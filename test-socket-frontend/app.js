const socket = io('http://localhost:6001');
const messageList = document.getElementById('messageList');
const tokenInput = document.getElementById('tokenInput');
const exerciseIdInput = document.getElementById('exerciseIdInput');
const chatIdInput = document.getElementById('chatIdInput');
const userMessageInput = document.getElementById('userMessageInput');
const createSessionButton = document.getElementById('createSessionButton');
const sendMessageButton = document.getElementById('sendMessageButton');

createSessionButton.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  const exerciseId = exerciseIdInput.value.trim();
  socket.emit('createChatSession', { token, exerciseId });
});

socket.on('chatId', chatId => {
  chatIdInput.value = chatId;
  createSessionButton.disabled = true;
  sendMessageButton.disabled = false;
});

sendMessageButton.addEventListener('click', () => {
  const chatId = chatIdInput.value.trim();
  const content = userMessageInput.value.trim();
  socket.emit('receiveUserMessage', { chatId, content });
  userMessageInput.value = '';
});

socket.on('messageStream', content => {
  const messageBubble = document.createElement('div');
  messageBubble.classList.add('messageBubble');
  messageBubble.textContent = content;
  messageList.appendChild(messageBubble);
  messageList.scrollTop = messageList.scrollHeight; // Auto-scroll to the latest message
  sendMessageButton.enabled = false;
});

socket.on('messageStreamEnd', () => {
  sendMessageButton.enabled = true;
});

