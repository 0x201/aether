namespace Aether.WinFormsApp.Views
{
    partial class ImportOrdersView
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            OpenOrderFilesButton = new Button();
            OrderFilePathTextBox = new TextBox();
            label1 = new Label();
            ImportOrderButton = new Button();
            openOrderFilesDialog = new OpenFileDialog();
            CloseButton = new Button();
            SuspendLayout();
            // 
            // OpenOrderFilesButton
            // 
            OpenOrderFilesButton.Location = new Point(28, 49);
            OpenOrderFilesButton.Name = "OpenOrderFilesButton";
            OpenOrderFilesButton.Size = new Size(75, 26);
            OpenOrderFilesButton.TabIndex = 0;
            OpenOrderFilesButton.Text = "Open";
            OpenOrderFilesButton.UseVisualStyleBackColor = true;
            OpenOrderFilesButton.Click += OpenOrderFilesButton_Click;
            // 
            // OrderFilePathTextBox
            // 
            OrderFilePathTextBox.Location = new Point(131, 109);
            OrderFilePathTextBox.Name = "OrderFilePathTextBox";
            OrderFilePathTextBox.Size = new Size(388, 23);
            OrderFilePathTextBox.TabIndex = 1;
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.Location = new Point(28, 118);
            label1.Name = "label1";
            label1.Size = new Size(97, 17);
            label1.TabIndex = 2;
            label1.Text = "Order file path:";
            // 
            // ImportOrderButton
            // 
            ImportOrderButton.Location = new Point(541, 109);
            ImportOrderButton.Name = "ImportOrderButton";
            ImportOrderButton.Size = new Size(75, 26);
            ImportOrderButton.TabIndex = 3;
            ImportOrderButton.Text = "Import";
            ImportOrderButton.UseVisualStyleBackColor = true;
            ImportOrderButton.Click += ImportOrderButton_Click;
            // 
            // openOrderFilesDialog
            // 
            openOrderFilesDialog.FileName = "openOrderFilesDialog";
            // 
            // CloseButton
            // 
            CloseButton.Location = new Point(640, 109);
            CloseButton.Name = "CloseButton";
            CloseButton.Size = new Size(75, 26);
            CloseButton.TabIndex = 4;
            CloseButton.Text = "Close";
            CloseButton.UseVisualStyleBackColor = true;
            CloseButton.Click += CloseButton_Click;
            // 
            // ImportOrdersView
            // 
            AutoScaleDimensions = new SizeF(7F, 17F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 510);
            Controls.Add(CloseButton);
            Controls.Add(ImportOrderButton);
            Controls.Add(label1);
            Controls.Add(OrderFilePathTextBox);
            Controls.Add(OpenOrderFilesButton);
            Name = "ImportOrdersView";
            Text = "Import Orders";
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion
        private Button OpenOrderFilesButton;
        private TextBox OrderFilePathTextBox;
        private Label label1;
        private Button ImportOrderButton;
        private OpenFileDialog openOrderFilesDialog;
        private Button CloseButton;
    }
}