import React, { useEffect, useState } from 'react';

function App() {
  const [tabs, setTabs] = useState([]);

  useEffect(() => {
    // Use the Chrome tabs API to get all tabs
    chrome.tabs.query({}, (tabs) => {
      setTabs(tabs);
    });
  }, []);

  return (
    <div style={{ width: 300 }}>
      <h2>Open Tabs</h2>
      <ul>
        {tabs.map(tab => (
          <li key={tab.id}>
            <a href={tab.url} target="_blank" rel="noopener noreferrer">
              {tab.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;