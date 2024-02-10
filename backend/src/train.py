import torch
from nn import LERMO_NN  
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import f1_score, recall_score, precision_score, accuracy_score
from tabulate import tabulate
from lib.utils import get_args
from lib.loader import LERMO_Dataset
from torch.utils.data import DataLoader, random_split
import os
import wandb

def train(model, optimizer, loss_fn, train_loader, device="cpu"):
    model.train()
    training_loss = 0.0
    all_predictions_train = []
    all_targets_train = []

    for batch in train_loader:
        optimizer.zero_grad()
        inputs, targets = batch
        inputs = inputs.to(device)
        targets = targets.to(device).squeeze()
        targets = torch.argmax(targets, dim=1)
        output = model(inputs)
        loss = loss_fn(output, targets)
        loss.backward()
        optimizer.step()
        training_loss += loss.data.item()
        all_predictions_train.extend(torch.argmax(output, dim=1).cpu().numpy())
        all_targets_train.extend(targets.cpu().numpy())

    training_loss /= len(train_loader.dataset)

    f1_train = f1_score(all_targets_train, all_predictions_train, average="weighted")
    recall_train = recall_score(all_targets_train, all_predictions_train, average="weighted")
    precision_train = precision_score(all_targets_train, all_predictions_train, average="weighted", zero_division=1)
    accuracy_train = accuracy_score(all_targets_train, all_predictions_train)

    results = {
        'training_loss': training_loss,
        'accuracy_train': accuracy_train,
        'f1_train': f1_train,
        'recall_train': recall_train,
        'precision_train': precision_train
    }

    return results


def val(model, loss_fn, val_loader, device="cpu"):
    model.eval()
    valid_loss = 0.0
    all_predictions = []
    all_targets = []

    with torch.no_grad():
        for batch in val_loader:
            inputs, targets = batch
            targets = torch.argmax(targets, dim=2).squeeze(dim=1)
            targets = targets.to(device)
            inputs = inputs.to(device)

            output = model(inputs)
            loss = loss_fn(output, targets)
            valid_loss += loss.data.item() * inputs.size(0)
            predictions = torch.argmax(output, dim=1)

            all_predictions.extend(predictions.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())

    valid_loss /= len(val_loader.dataset)

    f1 = f1_score(all_targets, all_predictions, average="weighted")
    recall = recall_score(all_targets, all_predictions, average="weighted")
    precision = precision_score(all_targets, all_predictions, average="weighted", zero_division=1)
    accuracy = accuracy_score(all_targets, all_predictions)

    results = {
        'valid_loss': valid_loss,
        'accuracy_val': accuracy,
        'f1_val': f1,
        'recall_val': recall,
        'precision_val': precision
    }

    return results


def test(model, loss_fn, test_loader, device="cpu"):
    model.eval()
    test_loss = 0.0
    all_predictions = []
    all_targets = []

    with torch.no_grad():
        for batch in test_loader:
            inputs, targets = batch
            targets = torch.argmax(targets, dim=2).squeeze(dim=1)
            targets = targets.to(device)
            inputs = inputs.to(device)

            output = model(inputs)
            loss = loss_fn(output, targets)
            test_loss += loss.data.item() * inputs.size(0)
            predictions = torch.argmax(output, dim=1)

            all_predictions.extend(predictions.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())

    test_loss /= len(test_loader.dataset)

    f1 = f1_score(all_targets, all_predictions, average="weighted")
    recall = recall_score(all_targets, all_predictions, average="weighted")
    precision = precision_score(all_targets, all_predictions, average="weighted", zero_division=1)
    accuracy = accuracy_score(all_targets, all_predictions)

    results = {
        'test_loss': test_loss,
        'accuracy_test': accuracy,
        'f1_test': f1,
        'recall_test': recall,
        'precision_test': precision
    }

    return results


def log_results(epoch, train_results, val_results, test_results):
    table_headers = ["Epoch", 
                    "Training Loss", 
                    "Validation Loss", 
                    "Test Loss",
                    "Accuracy", 
                    "F1 Score", 
                    "Recall", 
                    "Precision", 
                    "Train Acc", "Train F1", "Train RC", "Train Prec",
                    "Test Acc", "Test F1", "Test RC", "Test Prec"]
    
    training_loss = train_results['training_loss']
    accuracy_train = train_results['accuracy_train']
    f1_train = train_results['f1_train']
    recall_train = train_results['recall_train']
    precision_train = train_results['precision_train']

    valid_loss = val_results['valid_loss']
    accuracy = val_results['accuracy_val']
    f1 = val_results['f1_val']
    recall = val_results['recall_val']
    precision = val_results['precision_val']

    test_loss = test_results['test_loss']
    test_accuracy = test_results['accuracy_test']
    test_f1 = test_results['f1_test']
    test_recall = test_results['recall_test']
    test_precision = test_results['precision_test']

    metrics_data = [
        [epoch+1, 
         training_loss, 
         valid_loss, 
         test_loss, 
         accuracy, 
         f1, 
         recall, 
         precision, 
         accuracy_train, f1_train, recall_train, precision_train,
         test_accuracy, test_f1, test_recall, test_precision]
    ]

    table_str = tabulate(metrics_data, headers=table_headers, tablefmt="grid") + "\n"
    print(table_str)
    return table_str

def get_loaders(args):    
    dataset = LERMO_Dataset(args.csv_dataset_path,
                            selected_classes=args.selected_classes,
                            samples_per_class=args.samples_per_class,
                            balanced=args.balanced, args=args, isTrain=True)
    
    test_dataset = LERMO_Dataset(args.csv_test_dataset_path,
                            selected_classes=args.selected_classes,
                            balanced=args.balanced,
                            samples_per_class=args.samples_per_class, 
                            args=args, isTrain=False)
    
    dataset_size = len(dataset)
    train_size = int(args.train_ratio * dataset_size)
    val_size = dataset_size - train_size
    train_dataset, val_dataset = random_split(dataset, 
                                            [train_size, val_size])
    batch_size = args.batch_size
    train_loader = DataLoader(train_dataset, 
                            batch_size=batch_size,
                            shuffle=True, num_workers=8)

    val_loader = DataLoader(val_dataset, 
                            batch_size=batch_size, 
                            shuffle=True, num_workers=8)

    test_loader = DataLoader(test_dataset, 
                            batch_size=batch_size, 
                            shuffle=True, num_workers=8)

    return train_loader, val_loader, test_loader, dataset

best_model = None
def store_model(model, val_results, best_val_acc):
    global best_model
    if val_results['accuracy_val'] > best_val_acc:
        best_val_acc = val_results['accuracy_val']
        best_model = model  


def save_model(model, save_logs_at, epoch, args):
    print(f"{save_logs_at}")
    torch.save(model.state_dict(), f"{save_logs_at}/best_model_[{epoch+1}-{args.epochs}].pt")

    x = torch.rand(args.batch_size, 42)
    x = x.to(args.device)
    torch.onnx.export(model,                   
                    x,                         
                    f"{save_logs_at}/best_model_[{epoch+1}-{args.epochs}].onnx",   
                    export_params=True,        
                    opset_version=10,          
                    do_constant_folding=True,  
                    input_names = ['input'],   
                    output_names = ['output'], 
                    dynamic_axes ={'input'  : {0 : 'batch_size'}, 
                                    'output' : {0 : 'batch_size'}})


def run(args):
    wandb.init()
    train_loader, val_loader, test_loader, dataset = get_loaders(args)
    log = f"\n>>> total classes {dataset.num_classes} size {len(train_loader.dataset)} <<<\n"
    log += dataset.df["Label"].value_counts().to_string() + "\n"
    print(log)
    save_logs_at = args.log_file_path
    if not os.path.exists(save_logs_at): os.makedirs(save_logs_at)
    
    epochs = args.epochs
    device = args.device

    model = LERMO_NN(args.input_size, args.hidden_size, dataset.num_classes)
    model = model.to(device)
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    loss_fn = nn.CrossEntropyLoss()
    best_val_acc = 0

    for epoch in range(epochs):
        train_results = train(model, optimizer, loss_fn, train_loader, device)
        val_results   = val(model, loss_fn, val_loader, device)
        test_results  = test(model, loss_fn, test_loader, device)
        log += log_results(epoch, train_results, val_results, test_results)
        store_model(model, val_results, best_val_acc)
        wandb.log(train_results, step=epoch) 
        wandb.log(val_results, step=epoch) 
        wandb.log(test_results, step=epoch) 
    save_model(model=best_model, save_logs_at=save_logs_at, epoch=epoch, args=args)

    with open(f"{save_logs_at}/log.txt", "w") as f:
        f.write(log)

def main():
    args = get_args()
    run(args)
    

if __name__ == "__main__":
    main()