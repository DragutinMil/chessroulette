import React from 'react';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type FooterProps = {
  activeWidget: 'chat' | 'camera';
  setActiveWidget: (widget: 'chat' | 'camera') => void;
};

export const Footer: React.FC<FooterProps> = ({ activeWidget, setActiveWidget }) => {
  return (
    <div className="footer fixed bottom-0 left-0 right-0 bg-black p-4 flex justify-between items-center md:hidden">
      <div className="flex gap-8 w-full justify-between items-center px-4">
        {/* Camera Icon */}
        <div className="icon" onClick={() => setActiveWidget('camera')}>
          {activeWidget === 'camera' ? (
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#07DA63">
              <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff">
              <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z"/>
            </svg>
          )}
        </div>

        {/* Chat Icon */}
        <div className="icon" onClick={() => setActiveWidget('chat')}>
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" 
            fill={activeWidget === 'chat' ? "#07DA63" : "#ffffff"}>
            <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
          </svg>
        </div>

        {/* Draw Button */}
        <div className="icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M200-120q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-400q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm560-240H200v160h560v-160Z"/>
        </svg>
        </div>

        {/* Takeback Button */}
        <div className="icon">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M680-160v-400H313l144 144-56 57-241-241 240-240 57 57-144 143h447v480h-80Z"/></svg>
        </div>

        {/* Resign Button */}
        <div className="icon">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#ffffff">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};