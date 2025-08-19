import React, { useState } from 'react';
import { 
  Power, 
  Volume2, 
  VolumeX, 
  Minus,
  Plus,
  Wind,
  Thermometer,
  Lightbulb,
  Tv,
  Music,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Palette,
  Timer,
  Snowflake,
  Sun,
  Droplets,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic,
  ChefHat,
  Coffee,
  Utensils,
  Refrigerator,
  WashingMachine,
  Trash2,
  Shield,
  Camera,
  Lock,
  Unlock,
  Home,
  Zap,
  Activity,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface DeviceControlProps {
  deviceType: string;
  isActive: boolean;
  onToggle: () => void;
  onSettingChange?: (setting: string, value: any) => void;
}

interface DeviceState {
  fanSpeed: number;
  temperature: number;
  volume: number;
  channel: number;
  brightness: number;
  color: string;
  timer: number;
  mode: string;
  swingMode: boolean;
  source: string;
  cookingMode: string;
  washCycle: string;
  cleaningMode: string;
  isLocked: boolean;
  isRecording: boolean;
  isArmed: boolean;
}

export const DeviceControl: React.FC<DeviceControlProps> = ({
  deviceType,
  isActive,
  onToggle,
  onSettingChange
}) => {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    fanSpeed: 1,
    temperature: 24,
    volume: 50,
    channel: 99,
    brightness: 80,
    color: '#ffffff',
    timer: 0,
    mode: 'auto',
    swingMode: false,
    source: 'HDMI1',
    cookingMode: 'normal',
    washCycle: 'normal',
    cleaningMode: 'auto',
    isLocked: false,
    isRecording: false,
    isArmed: false
  });

  const updateSetting = (setting: string, value: any) => {
    setDeviceState(prev => ({ ...prev, [setting]: value }));
    onSettingChange?.(setting, value);
  };

  const getDeviceIcon = () => {
    const iconClass = `h-6 w-6 ${isActive ? 'text-green-500' : 'text-gray-400'}`;
    
    switch (deviceType.toLowerCase()) {
      // Fans
      case 'ceiling fan':
      case 'table fan':
      case 'tower fan':
      case 'exhaust fan':
        return <Wind className={`${iconClass} ${isActive ? 'animate-spin' : ''}`} />;
      
      // Air Conditioning & Temperature
      case 'air conditioner':
      case 'window ac':
      case 'split ac':
      case 'smart thermostat':
        return <Snowflake className={iconClass} />;
      case 'room heater':
      case 'water heater':
      case 'electric fireplace':
        return <Sun className={iconClass} />;
      case 'humidifier':
      case 'dehumidifier':
      case 'air purifier':
        return <Droplets className={iconClass} />;
      
      // Lighting
      case 'led light':
      case 'table lamp':
      case 'floor lamp':
      case 'garden light':
        return <Lightbulb className={iconClass} />;
      
      // Entertainment
      case 'television':
      case 'smart tv':
        return <Tv className={iconClass} />;
      case 'sound system':
      case 'music player':
      case 'home theater':
        return <Music className={iconClass} />;
      
      // Appliances
      case 'microwave':
      case 'toaster':
      case 'rice cooker':
        return <ChefHat className={iconClass} />;
      case 'coffee maker':
      case 'electric kettle':
        return <Coffee className={iconClass} />;
      case 'blender':
        return <Utensils className={iconClass} />;
      case 'refrigerator':
        return <Refrigerator className={iconClass} />;
      case 'dishwasher':
      case 'washing machine':
      case 'dryer':
        return <WashingMachine className={iconClass} />;
      case 'vacuum cleaner':
      case 'robot vacuum':
        return <Trash2 className={iconClass} />;
      case 'iron':
        return <Settings className={iconClass} />;
      
      // Security & Smart Home
      case 'security camera':
        return <Camera className={iconClass} />;
      case 'door lock':
      case 'garage door':
        return deviceState.isLocked ? <Lock className={iconClass} /> : <Unlock className={iconClass} />;
      case 'smart plug':
      case 'smart switch':
        return <Zap className={iconClass} />;
      case 'motion sensor':
      case 'smoke detector':
      case 'smart doorbell':
        return <Shield className={iconClass} />;
      case 'pool pump':
      case 'sprinkler system':
        return <Droplets className={iconClass} />;
      
      default:
        return <Power className={iconClass} />;
    }
  };

  const renderRealisticSwitch = () => {
    return (
      <div className="relative">
        {/* Switch Base */}
        <div className={`
          w-16 h-8 rounded-full border-2 transition-all duration-300 cursor-pointer
          ${isActive 
            ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/30' 
            : 'bg-gray-300 border-gray-400 shadow-inner'
          }
        `} onClick={onToggle}>
          {/* Switch Toggle */}
          <div className={`
            w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 transform
            ${isActive ? 'translate-x-8' : 'translate-x-1'}
            mt-0.5
          `}>
            {/* Inner highlight */}
            <div className={`
              w-4 h-4 rounded-full mt-1 ml-1 transition-all duration-300
              ${isActive ? 'bg-green-100' : 'bg-gray-100'}
            `} />
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={`
          absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300
          ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}
        `} />
      </div>
    );
  };

  const renderDeviceSpecificControls = () => {
    if (!isActive) return null;

    switch (deviceType.toLowerCase()) {
      case 'ceiling fan':
      case 'table fan':
      case 'tower fan':
      case 'exhaust fan':
        return (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fan Speed</span>
              <Badge variant="outline">{deviceState.fanSpeed}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateSetting('fanSpeed', Math.max(1, deviceState.fanSpeed - 1))}
                disabled={deviceState.fanSpeed <= 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Slider
                value={[deviceState.fanSpeed]}
                onValueChange={([value]) => updateSetting('fanSpeed', value)}
                max={5}
                min={1}
                step={1}
                className="flex-1"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateSetting('fanSpeed', Math.min(5, deviceState.fanSpeed + 1))}
                disabled={deviceState.fanSpeed >= 5}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'air conditioner':
      case 'window ac':
      case 'split ac':
      case 'smart thermostat':
        return (
          <div className="mt-4 space-y-4">
            {/* Temperature Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Temperature</span>
                <Badge variant="outline">{deviceState.temperature}°C</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.max(16, deviceState.temperature - 1))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  max={30}
                  min={16}
                  step={1}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.min(30, deviceState.temperature + 1))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Mode Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode</span>
                <Badge variant="outline">{deviceState.mode}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {['cool', 'heat', 'dry', 'auto', 'fan'].map(mode => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={deviceState.mode === mode ? "default" : "outline"}
                    onClick={() => updateSetting('mode', mode)}
                    className="text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Fan Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fan Speed</span>
                <Badge variant="outline">{deviceState.fanSpeed}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('fanSpeed', Math.max(1, deviceState.fanSpeed - 1))}
                  disabled={deviceState.fanSpeed <= 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.fanSpeed]}
                  onValueChange={([value]) => updateSetting('fanSpeed', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('fanSpeed', Math.min(5, deviceState.fanSpeed + 1))}
                  disabled={deviceState.fanSpeed >= 5}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Swing Mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Swing Mode</span>
              <Button
                size="sm"
                variant={deviceState.swingMode ? "default" : "outline"}
                onClick={() => updateSetting('swingMode', !deviceState.swingMode)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {deviceState.swingMode ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        );

      case 'television':
      case 'smart tv':
        return (
          <div className="mt-4 space-y-4">
            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume</span>
                <Badge variant="outline">{deviceState.volume}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => updateSetting('volume', 0)}>
                  <VolumeX className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('volume', Math.max(0, deviceState.volume - 10))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.volume]}
                  onValueChange={([value]) => updateSetting('volume', value)}
                  max={100}
                  min={0}
                  step={5}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('volume', Math.min(100, deviceState.volume + 10))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Channel Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Channel</span>
                <Badge variant="outline">{deviceState.channel}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('channel', Math.max(1, deviceState.channel - 1))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={deviceState.channel === 99 ? '' : deviceState.channel}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 99;
                    if (value >= 1 && value <= 999) {
                      updateSetting('channel', value);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="99"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('channel', Math.min(999, deviceState.channel + 1))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                  <Button
                    key={num}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentStr = deviceState.channel.toString();
                      // If current channel is the placeholder (99) or 0, start fresh with the clicked number
                      const newChannel = currentStr === '99' || currentStr === '0' || currentStr.length >= 3 ? 
                        num : parseInt(currentStr + num.toString());
                      if (newChannel >= 1 && newChannel <= 999) {
                        updateSetting('channel', newChannel);
                      }
                    }}
                    className="text-xs"
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSetting('channel', 99)}
                  className="text-xs col-span-2"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        );

      case 'led light':
      case 'table lamp':
      case 'floor lamp':
      case 'garden light':
        return (
          <div className="mt-4 space-y-4">
            {/* Brightness Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Brightness</span>
                <Badge variant="outline">{deviceState.brightness}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('brightness', Math.max(10, deviceState.brightness - 10))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.brightness]}
                  onValueChange={([value]) => updateSetting('brightness', value)}
                  max={100}
                  min={10}
                  step={10}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('brightness', Math.min(100, deviceState.brightness + 10))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Color Control (for RGB lights) */}
            {(deviceType.toLowerCase() === 'led light' || deviceType.toLowerCase() === 'garden light') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Color</span>
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: deviceState.color }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={deviceState.color}
                    onChange={(e) => updateSetting('color', e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <div className="flex gap-1 flex-1">
                    {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                      <Button
                        key={color}
                        size="sm"
                        variant="outline"
                        className="w-6 h-6 p-0"
                        style={{ backgroundColor: color }}
                        onClick={() => updateSetting('color', color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Timer Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Timer</span>
                <Badge variant="outline">{deviceState.timer > 0 ? `${deviceState.timer}min` : 'Off'}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => updateSetting('timer', 0)}>
                  <Timer className="h-4 w-4" />
                </Button>
                <div className="flex gap-1 flex-1">
                  {[15, 30, 60, 120].map(minutes => (
                    <Button
                      key={minutes}
                      size="sm"
                      variant={deviceState.timer === minutes ? "default" : "outline"}
                      onClick={() => updateSetting('timer', minutes)}
                      className="text-xs"
                    >
                      {minutes}m
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sound system':
      case 'music player':
      case 'home theater':
        return (
          <div className="mt-4 space-y-4">
            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume</span>
                <Badge variant="outline">{deviceState.volume}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => updateSetting('volume', 0)}>
                  <VolumeX className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.volume]}
                  onValueChange={([value]) => updateSetting('volume', value)}
                  max={100}
                  min={0}
                  step={5}
                  className="flex-1"
                />
                <Button size="sm" variant="outline">
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Media Controls */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Media Controls</span>
              <div className="flex items-center gap-2 justify-center">
                <Button size="sm" variant="outline">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Play className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      // Temperature Control Devices
      case 'room heater':
      case 'water heater':
      case 'electric fireplace':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Temperature</span>
                <Badge variant="outline">{deviceState.temperature}°C</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.max(10, deviceState.temperature - 1))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  max={40}
                  min={10}
                  step={1}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.min(40, deviceState.temperature + 1))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Timer Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Timer</span>
                <Badge variant="outline">{deviceState.timer > 0 ? `${deviceState.timer}min` : 'Off'}</Badge>
              </div>
              <div className="flex gap-1">
                {[0, 30, 60, 120, 240].map(minutes => (
                  <Button
                    key={minutes}
                    size="sm"
                    variant={deviceState.timer === minutes ? "default" : "outline"}
                    onClick={() => updateSetting('timer', minutes)}
                    className="text-xs"
                  >
                    {minutes === 0 ? 'Off' : `${minutes}m`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      // Air Quality Devices
      case 'humidifier':
      case 'dehumidifier':
      case 'air purifier':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Intensity</span>
                <Badge variant="outline">{['Low', 'Medium', 'High'][deviceState.fanSpeed - 1]}</Badge>
              </div>
              <div className="flex gap-1">
                {['Low', 'Medium', 'High'].map((level, index) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={deviceState.fanSpeed === index + 1 ? "default" : "outline"}
                    onClick={() => updateSetting('fanSpeed', index + 1)}
                    className="flex-1 text-xs"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode</span>
                <Badge variant="outline">{deviceState.mode}</Badge>
              </div>
              <div className="flex gap-1">
                {['auto', 'sleep', 'turbo'].map(mode => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={deviceState.mode === mode ? "default" : "outline"}
                    onClick={() => updateSetting('mode', mode)}
                    className="flex-1 text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      // Kitchen Appliances
      case 'microwave':
      case 'toaster':
      case 'rice cooker':
      case 'coffee maker':
      case 'electric kettle':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cooking Mode</span>
                <Badge variant="outline">{deviceState.cookingMode}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {['normal', 'quick', 'defrost', 'reheat'].map(mode => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={deviceState.cookingMode === mode ? "default" : "outline"}
                    onClick={() => updateSetting('cookingMode', mode)}
                    className="text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Timer</span>
                <Badge variant="outline">{deviceState.timer > 0 ? `${deviceState.timer}min` : 'Off'}</Badge>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 5, 10, 15].map(minutes => (
                  <Button
                    key={minutes}
                    size="sm"
                    variant={deviceState.timer === minutes ? "default" : "outline"}
                    onClick={() => updateSetting('timer', minutes)}
                    className="text-xs"
                  >
                    {minutes === 0 ? 'Off' : `${minutes}m`}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        );

      case 'refrigerator':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Temperature</span>
                <Badge variant="outline">{deviceState.temperature}°C</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.max(-5, deviceState.temperature - 1))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  max={8}
                  min={-5}
                  step={1}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.min(8, deviceState.temperature + 1))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode</span>
                <Badge variant="outline">{deviceState.mode}</Badge>
              </div>
              <div className="flex gap-1">
                {['normal', 'eco', 'supercool'].map(mode => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={deviceState.mode === mode ? "default" : "outline"}
                    onClick={() => updateSetting('mode', mode)}
                    className="flex-1 text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'dishwasher':
      case 'washing machine':
      case 'dryer':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wash Cycle</span>
                <Badge variant="outline">{deviceState.washCycle}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {['normal', 'quick', 'delicate', 'heavy'].map(cycle => (
                  <Button
                    key={cycle}
                    size="sm"
                    variant={deviceState.washCycle === cycle ? "default" : "outline"}
                    onClick={() => updateSetting('washCycle', cycle)}
                    className="text-xs capitalize"
                  >
                    {cycle}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Delay Start</span>
                <Badge variant="outline">{deviceState.timer > 0 ? `${deviceState.timer}h` : 'Off'}</Badge>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 4, 8].map(hours => (
                  <Button
                    key={hours}
                    size="sm"
                    variant={deviceState.timer === hours ? "default" : "outline"}
                    onClick={() => updateSetting('timer', hours)}
                    className="text-xs"
                  >
                    {hours === 0 ? 'Off' : `${hours}h`}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            </div>
          </div>
        );

      case 'vacuum cleaner':
      case 'robot vacuum':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cleaning Mode</span>
                <Badge variant="outline">{deviceState.cleaningMode}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {['auto', 'spot', 'edge', 'turbo'].map(mode => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={deviceState.cleaningMode === mode ? "default" : "outline"}
                    onClick={() => updateSetting('cleaningMode', mode)}
                    className="text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            </div>
            
            {deviceType.toLowerCase() === 'robot vacuum' && (
              <Button size="sm" variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-1" />
                Return to Dock
              </Button>
            )}
          </div>
        );

      case 'iron':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Temperature</span>
                <Badge variant="outline">{deviceState.temperature}°C</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.max(100, deviceState.temperature - 10))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Slider
                  value={[deviceState.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  max={220}
                  min={100}
                  step={10}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSetting('temperature', Math.min(220, deviceState.temperature + 10))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      // Security & Smart Home
      case 'security camera':
        return (
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                <Camera className="h-4 w-4 mr-1" />
                Live View
              </Button>
              <Button 
                size="sm" 
                variant={deviceState.isRecording ? "destructive" : "outline"} 
                className="flex-1"
                onClick={() => updateSetting('isRecording', !deviceState.isRecording)}
              >
                <Activity className="h-4 w-4 mr-1" />
                {deviceState.isRecording ? 'Stop Rec' : 'Record'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                Pan
              </Button>
              <Button size="sm" variant="outline">
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                Tilt
              </Button>
            </div>
          </div>
        );

      case 'door lock':
      case 'garage door':
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={deviceState.isLocked ? "destructive" : "default"}>
                {deviceState.isLocked ? 'Locked' : 'Unlocked'}
              </Badge>
            </div>
            
            <Button 
              size="sm" 
              variant={deviceState.isLocked ? "destructive" : "default"} 
              className="w-full"
              onClick={() => updateSetting('isLocked', !deviceState.isLocked)}
            >
              {deviceState.isLocked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
              {deviceState.isLocked ? 'Unlock' : 'Lock'}
            </Button>
          </div>
        );

      case 'smart plug':
      case 'smart switch':
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Power Consumption</span>
              <Badge variant="outline">12.5W</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Schedule Timer</span>
                <Badge variant="outline">{deviceState.timer > 0 ? `${deviceState.timer}h` : 'Off'}</Badge>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 4, 8, 12].map(hours => (
                  <Button
                    key={hours}
                    size="sm"
                    variant={deviceState.timer === hours ? "default" : "outline"}
                    onClick={() => updateSetting('timer', hours)}
                    className="text-xs"
                  >
                    {hours === 0 ? 'Off' : `${hours}h`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'motion sensor':
      case 'smoke detector':
      case 'smart doorbell':
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={deviceState.isArmed ? "default" : "secondary"}>
                {deviceState.isArmed ? 'Armed' : 'Disarmed'}
              </Badge>
            </div>
            
            <Button 
              size="sm" 
              variant={deviceState.isArmed ? "destructive" : "default"} 
              className="w-full"
              onClick={() => updateSetting('isArmed', !deviceState.isArmed)}
            >
              <Shield className="h-4 w-4 mr-1" />
              {deviceState.isArmed ? 'Disarm' : 'Arm'}
            </Button>
            
            <Button size="sm" variant="outline" className="w-full">
              <Activity className="h-4 w-4 mr-1" />
              Test Trigger
            </Button>
          </div>
        );

      case 'pool pump':
      case 'sprinkler system':
        return (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Schedule</span>
                <Badge variant="outline">{deviceState.timer > 0 ? `${deviceState.timer}h` : 'Manual'}</Badge>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 4, 6, 8].map(hours => (
                  <Button
                    key={hours}
                    size="sm"
                    variant={deviceState.timer === hours ? "default" : "outline"}
                    onClick={() => updateSetting('timer', hours)}
                    className="text-xs"
                  >
                    {hours === 0 ? 'Manual' : `${hours}h`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`transition-all duration-300 ${isActive ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getDeviceIcon()}
            <div>
              <h3 className="font-medium text-sm">{deviceType}</h3>
              <p className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {isActive ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>
          {renderRealisticSwitch()}
        </div>
        
        {renderDeviceSpecificControls()}
      </CardContent>
    </Card>
  );
};

export default DeviceControl;