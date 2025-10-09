namespace Workflow.API.DataSeed;

public class WorkflowDbContextSeed(ILogger<WorkflowDbContextSeed> logger) : IDbSeeder<WorkflowDbContext>
{
    private readonly ILogger<WorkflowDbContextSeed> _logger = logger;

    public async Task SeedAsync(WorkflowDbContext context)
    {
        _logger.LogInformation("Starting WorkflowDbContext seed");

        if (!context.Workflows.Any())
        {
            _logger.LogInformation("Seeding initial workflows data");
            var workflows = GetSampleWorkflows();
            context.Workflows.AddRange(workflows);
            await context.SaveChangesAsync();

            _logger.LogInformation("Seeded {Count} sample workflows", workflows.Count);
        }
        else
        {
            _logger.LogInformation("Workflow data already exists, skipping seed");
        }
    }

    private static List<WorkflowModel> GetSampleWorkflows()
    {
        var workflow1 = new WorkflowModel
        {
            Id = "1",
            Name = "Simple Linear Workflow",
            Nodes =
            [
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Start",
                        OperatorType = "start"
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "dummy",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Process Data",
                        OperatorType = "dummy",
                        Description = "Process the extracted data"
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "dummy",
                    Position = new Position { X = 500, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Validate Results",
                        OperatorType = "dummy",
                        Description = "Validate processed results"
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "end",
                    Position = new Position { X = 700, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "End",
                        OperatorType = "end"
                    }
                }
            ],
            Connections =
            [
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "3-4", SourceNodeId = "3", TargetNodeId = "4" }
            ],
            CreatedAt = DateTime.UtcNow
        };

        var workflow2 = new WorkflowModel
        {
            Id = "2",
            Name = "Decision Workflow",
            Nodes =
            [
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Start",
                        OperatorType = "start"
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "dummy",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Data Analysis",
                        OperatorType = "dummy",
                        Description = "Analyze input data"
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "branch",
                    Position = new Position { X = 500, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Check Value",
                        OperatorType = "branch",
                        Description = "Check if value is greater than threshold",
                        TaskParams = new Dictionary<string, object>
                        {
                            { "condition", "value > 100" }
                        }
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "dummy",
                    Position = new Position { X = 700, Y = 50 },
                    Data = new NodeData
                    {
                        Label = "High Value Path",
                        OperatorType = "dummy",
                        Description = "Process high value data"
                    }
                },
                new WorkflowNode
                {
                    Id = "5",
                    Type = "dummy",
                    Position = new Position { X = 700, Y = 150 },
                    Data = new NodeData
                    {
                        Label = "Low Value Path",
                        OperatorType = "dummy",
                        Description = "Process low value data"
                    }
                },
                new WorkflowNode
                {
                    Id = "6",
                    Type = "end",
                    Position = new Position { X = 900, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "End",
                        OperatorType = "end"
                    }
                }
            ],
            Connections =
            [
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "3-4", SourceNodeId = "3", TargetNodeId = "4", SourceHandle = "true" },
                new WorkflowConnection { Id = "3-5", SourceNodeId = "3", TargetNodeId = "5", SourceHandle = "false" },
                new WorkflowConnection { Id = "4-6", SourceNodeId = "4", TargetNodeId = "6" },
                new WorkflowConnection { Id = "5-6", SourceNodeId = "5", TargetNodeId = "6" }
            ],
            CreatedAt = DateTime.UtcNow
        };

        var workflow3 = new WorkflowModel
        {
            Id = "3",
            Name = "Complex Workflow",
            Nodes =
            [
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Start",
                        OperatorType = "start"
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "dummy",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Data Ingestion",
                        OperatorType = "dummy",
                        Description = "Ingest data from various sources"
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "dummy",
                    Position = new Position { X = 500, Y = 50 },
                    Data = new NodeData
                    {
                        Label = "ETL Process",
                        OperatorType = "dummy",
                        Description = "Extract, Transform, Load data"
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "dummy",
                    Position = new Position { X = 500, Y = 150 },
                    Data = new NodeData
                    {
                        Label = "Data Validation",
                        OperatorType = "dummy",
                        Description = "Validate ingested data"
                    }
                },
                new WorkflowNode
                {
                    Id = "5",
                    Type = "branch",
                    Position = new Position { X = 700, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Quality Check",
                        OperatorType = "branch",
                        Description = "Check data quality",
                        TaskParams = new Dictionary<string, object>
                        {
                            { "condition", "quality > 0.8" }
                        }
                    }
                },
                new WorkflowNode
                {
                    Id = "6",
                    Type = "dummy",
                    Position = new Position { X = 900, Y = 50 },
                    Data = new NodeData
                    {
                        Label = "High Quality Processing",
                        OperatorType = "dummy",
                        Description = "Process high quality data"
                    }
                },
                new WorkflowNode
                {
                    Id = "7",
                    Type = "dummy",
                    Position = new Position { X = 900, Y = 150 },
                    Data = new NodeData
                    {
                        Label = "Error Handling",
                        OperatorType = "dummy",
                        Description = "Handle low quality data"
                    }
                },
                new WorkflowNode
                {
                    Id = "8",
                    Type = "dummy",
                    Position = new Position { X = 1100, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Data Storage",
                        OperatorType = "dummy",
                        Description = "Store processed data"
                    }
                },
                new WorkflowNode
                {
                    Id = "9",
                    Type = "end",
                    Position = new Position { X = 1300, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "End",
                        OperatorType = "end"
                    }
                }
            ],
            Connections =
            [
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "2-4", SourceNodeId = "2", TargetNodeId = "4" },
                new WorkflowConnection { Id = "3-5", SourceNodeId = "3", TargetNodeId = "5" },
                new WorkflowConnection { Id = "4-5", SourceNodeId = "4", TargetNodeId = "5" },
                new WorkflowConnection { Id = "5-6", SourceNodeId = "5", TargetNodeId = "6", SourceHandle = "true" },
                new WorkflowConnection { Id = "5-7", SourceNodeId = "5", TargetNodeId = "7", SourceHandle = "false" },
                new WorkflowConnection { Id = "6-8", SourceNodeId = "6", TargetNodeId = "8" },
                new WorkflowConnection { Id = "7-8", SourceNodeId = "7", TargetNodeId = "8" },
                new WorkflowConnection { Id = "8-9", SourceNodeId = "8", TargetNodeId = "9" }
            ],
            CreatedAt = DateTime.UtcNow
        };

        var workflow4 = new WorkflowModel
        {
            Id = "4",
            Name = "ETL Workflow",
            Nodes =
            [
                new WorkflowNode
                {
                    Id = "1",
                    Type = "start",
                    Position = new Position { X = 100, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Start",
                        OperatorType = "start"
                    }
                },
                new WorkflowNode
                {
                    Id = "2",
                    Type = "extract",
                    Position = new Position { X = 300, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Extract Data",
                        OperatorType = "extract",
                        Description = "Extract data from JSON file",
                        TaskParams = new Dictionary<string, object>
                        {
                            { "filePath", "data/sample.json" }
                        }
                    }
                },
                new WorkflowNode
                {
                    Id = "3",
                    Type = "validate",
                    Position = new Position { X = 500, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Validate Data",
                        OperatorType = "validate",
                        Description = "Validate extracted data quality"
                    }
                },
                new WorkflowNode
                {
                    Id = "4",
                    Type = "load",
                    Position = new Position { X = 700, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "Load to Database",
                        OperatorType = "load",
                        Description = "Load validated data to in-memory database",
                        TaskParams = new Dictionary<string, object>
                        {
                            { "tableName", "etl_data" }
                        }
                    }
                },
                new WorkflowNode
                {
                    Id = "5",
                    Type = "end",
                    Position = new Position { X = 900, Y = 100 },
                    Data = new NodeData
                    {
                        Label = "End",
                        OperatorType = "end"
                    }
                }
            ],
            Connections =
            [
                new WorkflowConnection { Id = "1-2", SourceNodeId = "1", TargetNodeId = "2" },
                new WorkflowConnection { Id = "2-3", SourceNodeId = "2", TargetNodeId = "3" },
                new WorkflowConnection { Id = "3-4", SourceNodeId = "3", TargetNodeId = "4" },
                new WorkflowConnection { Id = "4-5", SourceNodeId = "4", TargetNodeId = "5" }
            ],
            CreatedAt = DateTime.UtcNow
        };

        return [workflow1, workflow2, workflow3, workflow4];
    }
}