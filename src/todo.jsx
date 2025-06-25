import React, { useState } from "react";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const addTodo = () => {
    if (inputValue.trim() !== "") {
      const newTodo = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const todoItemStyle = (completed) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px",
    margin: "5px 0",
    borderRadius: "5px",
    opacity: completed ? 0.5 : 1,
    textDecoration: completed ? "line-through" : "none",
    transition: "opacity 0.3s ease",
  });

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Todo List</h2>
      
      {/* Input section */}
      <div style={{ display: "flex", marginBottom: "20px", gap: "10px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new todo..."
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            fontSize: "16px",
          }}
        />
        <button
          onClick={addTodo}
        >
          Add
        </button>
      </div>

      {/* Todo list */}
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {todos.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} style={todoItemStyle(todo.completed)}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: "16px" }}>{todo.text}</span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;