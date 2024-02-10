import torch
import torch.nn as nn
import torch.nn.init as init

class LERMO_NN(nn.Module):
    def __init__(self, input_size, hidden_size, num_classes):
        super(LERMO_NN, self).__init__()
        self.model = nn.Sequential(
                nn.Linear(input_size, hidden_size),
                nn.BatchNorm1d(hidden_size),
                nn.Tanh(),
                nn.Linear(hidden_size, hidden_size),
                nn.LeakyReLU(),
                nn.Linear(hidden_size,  hidden_size),
                nn.LeakyReLU(),
                nn.Linear(hidden_size,  num_classes)
        )
    
        for layer in self.model:
            if isinstance(layer, nn.Linear):
                init.kaiming_normal_(layer.weight, 
                                     mode='fan_in', 
                                     nonlinearity='leaky_relu')

    def forward(self, x):
        x = x.to(dtype=torch.float32) 
        output = self.model(x)
        return output
    