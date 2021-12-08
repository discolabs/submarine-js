import { RadioWrapper } from "./radio-wrapper";
import { SubmarineConfig, SubmarineContext } from "./contexts";

export const App = ({ submarineConfig, submarineContext }) => {
  return (
    <SubmarineConfig.Provider value={submarineConfig}>
      <SubmarineContext.Provider value={submarineContext}>
        <div class="content-box">
          <RadioWrapper gatewayId={submarineConfig.submarineGatewayId} />
        </div>
      </SubmarineContext.Provider>
    </SubmarineConfig.Provider>
  )
};
