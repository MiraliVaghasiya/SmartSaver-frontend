import React, { useState, useRef, useEffect } from "react";
import "./style/ChatBot.css";

// Helper: get most intensive appliance
function getMostIntensiveAppliance(summaryData, type) {
  if (!summaryData) return null;
  if (type === "water") {
    const consumptions = {
      Shower: Number(summaryData.totalShowerConsumption) || 0,
      Toilet: Number(summaryData.totalToiletConsumption) || 0,
      Dishwasher: Number(summaryData.totalDishwasherConsumption) || 0,
      "Washing Machine":
        Number(summaryData.totalWashingMachineConsumption) || 0,
      Sink: Number(summaryData.totalSinkConsumption) || 0,
    };
    const maxAppliance = Object.entries(consumptions).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    return { name: maxAppliance[0], value: maxAppliance[1] };
  } else {
    const consumptions = {
      Fan: Number(summaryData.totalFanConsumption) || 0,
      Heater: Number(summaryData.totalHeaterConsumption) || 0,
      Refrigerator: Number(summaryData.totalRefrigeratorConsumption) || 0,
      "Washing Machine":
        Number(summaryData.totalWashingMachineConsumption) || 0,
      Lights: Number(summaryData.totalLightsConsumption) || 0,
    };
    const maxAppliance = Object.entries(consumptions).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    return { name: maxAppliance[0], value: maxAppliance[1] };
  }
}

// Helper: get usage status
function getUsageStatus(summaryData, type) {
  if (!summaryData) return "N/A";
  if (type === "water") {
    const avg = Number(summaryData.averageWaterUsage) || 0;
    if (avg <= 130) return "Low";
    if (avg <= 200) return "Average";
    return "High";
  } else {
    const avg = Number(summaryData.averageElectricityUsage) || 0;
    if (avg <= 8) return "Low";
    if (avg <= 15) return "Average";
    return "High";
  }
}

// Helper: tips
const waterTips = [
  "Install a water-efficient showerhead.",
  "Limit shower time to 5 minutes.",
  "Fix leaks in fixtures.",
  "Only run full loads in washing machine and dishwasher.",
  "Turn off tap while brushing teeth or washing dishes.",
  "Install aerators on faucets.",
];
const electricityTips = [
  "Turn off lights when not in use.",
  "Use LED bulbs.",
  "Unplug devices when not needed.",
  "Use energy-efficient appliances.",
  "Set AC to 24°C/75°F.",
  "Use cold water for laundry.",
  "Insulate your home for better heating/cooling.",
];

const ChatBot = ({ summaryData, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "Hi! 👋 I'm your SmartSaver assistant. I can help you analyze your water and electricity usage. What would you like to know?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Main answer logic
  const answerQuestion = (query) => {
    if (!summaryData)
      return "No data loaded. Please select or upload a dataset.";
    const q = query.toLowerCase();
    // Water
    if (type === "water") {
      if (q.includes("total water"))
        return `Total Water: ${Number(
          summaryData.totalWaterConsumption
        ).toFixed(2)} L`;
      if (q.includes("daily average"))
        return `Daily Average: ${Number(summaryData.averageWaterUsage).toFixed(
          2
        )} L`;
      if (q.includes("peak usage day") || q.includes("peak day"))
        return `Peak Usage Day: ${summaryData.maxWaterUsage}`;
      if (q.includes("shower"))
        return `Shower usage: ${Number(
          summaryData.totalShowerConsumption
        ).toFixed(2)} L`;
      if (q.includes("washing machine"))
        return `Washing Machine usage: ${Number(
          summaryData.totalWashingMachineConsumption
        ).toFixed(2)} L`;
      if (q.includes("sink"))
        return `Sink usage: ${Number(summaryData.totalSinkConsumption).toFixed(
          2
        )} L`;
      if (q.includes("toilet"))
        return `Toilet usage: ${Number(
          summaryData.totalToiletConsumption
        ).toFixed(2)} L`;
      if (q.includes("dishwasher"))
        return `Dishwasher usage: ${Number(
          summaryData.totalDishwasherConsumption
        ).toFixed(2)} L`;
      if (q.includes("most water") || q.includes("most intensive")) {
        const most = getMostIntensiveAppliance(summaryData, "water");
        return `Most Water-Intensive Appliance: ${
          most.name
        } (${most.value.toFixed(2)} L)`;
      }
      if (q.includes("usage status"))
        return `Usage Status: ${getUsageStatus(summaryData, "water")}`;
      if (q.includes("tip") || q.includes("save") || q.includes("reduce")) {
        return `💡 Water Saving Tips:\n- ${waterTips.join("\n- ")}`;
      }
      // Add dataset comparison queries
      if (q.includes("dataset comparison") || q.includes("compare datasets")) {
        if (summaryData.allDatasetsStats?.datasetCount < 2) {
          return "Not enough datasets available for comparison. Please upload more datasets.";
        }
        return `Dataset Comparison:\n- Total Usage vs Average: ${Number(
          summaryData.totalWaterConsumption
        ).toFixed(2)}L vs ${summaryData.allDatasetsStats.totalAverage.toFixed(
          2
        )}L\n- Daily Usage vs Average: ${Number(
          summaryData.averageWaterUsage
        ).toFixed(2)}L vs ${summaryData.allDatasetsStats.dailyAverage.toFixed(
          2
        )}L`;
      }
    }
    // Electricity
    if (type === "electricity") {
      if (q.includes("total electricity"))
        return `Total Electricity: ${Number(
          summaryData.totalElectricityConsumption
        ).toFixed(2)} kWh`;
      if (q.includes("daily average"))
        return `Daily Average: ${Number(
          summaryData.averageElectricityUsage
        ).toFixed(2)} kWh`;
      if (q.includes("peak usage day") || q.includes("peak day"))
        return `Peak Usage Day: ${summaryData.maxElectricityUsage}`;
      if (q.includes("fan"))
        return `Fan usage: ${Number(summaryData.totalFanConsumption).toFixed(
          2
        )} kWh`;
      if (q.includes("heater"))
        return `Heater usage: ${Number(
          summaryData.totalHeaterConsumption
        ).toFixed(2)} kWh`;
      if (q.includes("refrigerator"))
        return `Refrigerator usage: ${Number(
          summaryData.totalRefrigeratorConsumption
        ).toFixed(2)} kWh`;
      if (q.includes("washing machine"))
        return `Washing Machine usage: ${Number(
          summaryData.totalWashingMachineConsumption
        ).toFixed(2)} kWh`;
      if (q.includes("light"))
        return `Lights usage: ${Number(
          summaryData.totalLightsConsumption
        ).toFixed(2)} kWh`;
      if (q.includes("most energy") || q.includes("most intensive")) {
        const most = getMostIntensiveAppliance(summaryData, "electricity");
        return `Most Energy-Intensive Appliance: ${
          most.name
        } (${most.value.toFixed(2)} kWh)`;
      }
      if (q.includes("usage status"))
        return `Usage Status: ${getUsageStatus(summaryData, "electricity")}`;
      if (q.includes("tip") || q.includes("save") || q.includes("reduce")) {
        return `💡 Electricity Saving Tips:\n- ${electricityTips.join("\n- ")}`;
      }
      // Add dataset comparison queries
      if (q.includes("dataset comparison") || q.includes("compare datasets")) {
        if (summaryData.allDatasetsStats?.datasetCount < 2) {
          return "Not enough datasets available for comparison. Please upload more datasets.";
        }
        return `Dataset Comparison:\n- Total Usage vs Average: ${Number(
          summaryData.totalElectricityConsumption
        ).toFixed(
          2
        )} kWh vs ${summaryData.allDatasetsStats.totalAverage.toFixed(
          2
        )} kWh\n- Daily Usage vs Average: ${Number(
          summaryData.averageElectricityUsage
        ).toFixed(
          2
        )} kWh vs ${summaryData.allDatasetsStats.dailyAverage.toFixed(2)} kWh`;
      }
    }
    // Help
    if (
      q.includes("help") ||
      q.includes("what can you do") ||
      q.includes("summary")
    ) {
      return "I can help you with:\n- Total usage\n- Daily average\n- Peak usage day\n- Appliance usage breakdown\n- Most intensive appliance\n- Usage status\n- Saving tips\n- Dataset comparison";
    }
    return "Sorry, I didn't understand. Try asking about total, average, peak, appliance usage, most intensive appliance, usage status, tips, or dataset comparison.";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMessage = {
      type: "user",
      content: inputMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
    const response = answerQuestion(inputMessage);
    const botMessage = {
      type: "bot",
      content: response,
    };
    setMessages((prev) => [...prev, botMessage]);
    setInputMessage("");
  };

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <span className="chat-icon">💬</span>
          Chat with SmartSaver
        </button>
      )}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>SmartSaver Assistant</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                {message.type === "bot" && (
                  <span className="bot-avatar">🤖</span>
                )}
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your utility usage..."
              className="message-input"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
