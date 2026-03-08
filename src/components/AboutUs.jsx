import React from "react";
import BackButton from "../components/BackButton.jsx";
import { FaSolarPanel, FaUsers, FaChartLine, FaLeaf } from "react-icons/fa";
import "../styles/AboutUs.css";

export default function AboutUs() {
  const members = [
    "Jessan John Orevillo",
    "Mark Reyes",
    "Toni Grace Marie Bagtasos",
    "Fatima Cabigon",
    "Karylle Quisto",
  ];

  return (
    <div className="about-page">
      <BackButton />

      {/* Top 3 containers side by side */}
      <div className="top-containers">
        <div className="about-container">
          <FaSolarPanel className="container-icon" />
          <h2 className="about-title">Solar Tracker System</h2>
          <p className="about-text">
            Optimizes solar energy collection by tracking the sun automatically. Real-time monitoring and smart energy storage maximize efficiency.
          </p>
        </div>

        <div className="about-container">
          <FaUsers className="container-icon" />
          <h2 className="about-title">Our Team</h2>
          <div className="members-container">
            {members.map((member, index) => (
              <div key={index} className="member-card">
                {member}
              </div>
            ))}
          </div>
        </div>

        <div className="about-container">
          <FaChartLine className="container-icon" />
          <h2 className="about-title">Performance</h2>
          <p className="about-text">
            System increases solar panel efficiency by up to 40% with automatic tracking and real-time performance monitoring.
          </p>
        </div>
      </div>

      {/* Fourth container below */}
      <div className="about-container wide-container">
        <FaLeaf className="container-icon" />
        <h2 className="about-title">Our Mission</h2>
        <p className="about-text">
          We aim to provide practical renewable energy solutions through innovation, teamwork, and dedication. Our goal is a sustainable future with smarter solar energy.
        </p>
      </div>
    </div>
  );
}